import { GraniteEmbeddingService, ChunkMetadata } from './granite/embedding.service';
import { GraniteLLMService } from './granite/llm.service';
import { VectorStore } from './vectorStore.service';
import { encode, decode } from 'gpt-tokenizer';

interface RfpInput {
    title: string;
    shortDescription: string;
    timeline: {
        startDate: string;
        endDate: string;
    };
    budget: number;
    submissionDeadline: string;
    categoryId: string;
    requirements?: {
        categories: Record<string, string[]>;
        uncategorized: string[];
    };
    evaluationMetrics?: {
        categories: Record<string, Record<string, number>>;
        uncategorized: Array<{
            name: string;
            weightage: number;
            description?: string;
        }>;
    };
    specialInstructions?: string;
}

interface DynamicRfpInfo {
    title?: string;
    shortDescription?: string;
    timeline?: {
        startDate?: string;
        endDate?: string;
    };
    budget?: number;
    submissionDeadline?: string;
    requirements?: {
        categories: Record<string, string[]>;
        uncategorized: string[];
    };
    evaluationMetrics?: {
        categories: Record<string, Record<string, number>>;
        uncategorized: Array<{
            name: string;
            weightage: number;
            description?: string;
        }>;
    };
    specialInstructions?: string;
}

export class RfpGenerationService {
    private embeddings: GraniteEmbeddingService;
    private llm: GraniteLLMService;
    private vectorStore: VectorStore;
    private readonly MAX_SECTION_TOKENS = 2000;
    private readonly CHUNK_OVERLAP = 100; // Token overlap between chunks

    constructor() {
        this.embeddings = new GraniteEmbeddingService();
        this.llm = new GraniteLLMService();
        this.vectorStore = new VectorStore();
    }

    async generateRfpDescription(input: RfpInput): Promise<string> {
        const prompt = `
Create a detailed RFP (Request for Proposal) description based on the following information:

Title: ${input.title}
Short Description: ${input.shortDescription}
Budget: $${input.budget.toLocaleString()}
Timeline: ${input.timeline.startDate} to ${input.timeline.endDate}
Submission Deadline: ${input.submissionDeadline}

Requirements:
${input.requirements ? Object.entries(input.requirements.categories).map(([category, reqs]) => 
    `${category}:\n${reqs.map(r => `- ${r}`).join('\n')}`
).join('\n\n') + (input.requirements.uncategorized.length ? 
    `\n\nUncategorized:\n${input.requirements.uncategorized.map(r => `- ${r}`).join('\n')}` : '') 
: 'Not specified'}

Evaluation Metrics:
${input.evaluationMetrics ? 
    Object.entries(input.evaluationMetrics.categories).map(([category, metrics]) => 
        `${category}:\n${Object.entries(metrics).map(([name, weightage]) => 
            `- ${name} (${weightage}%)`).join('\n')}`
    ).join('\n\n') + 
    (input.evaluationMetrics.uncategorized.length ? 
        `\n\nUncategorized:\n${input.evaluationMetrics.uncategorized.map(m => 
            `- ${m.name} (${m.weightage}%)${m.description ? `: ${m.description}` : ''}`).join('\n')}` 
        : '')
: 'Not specified'}

Special Instructions:
${input.specialInstructions || 'None'}

Please generate a comprehensive, well-structured RFP description that:
1. Clearly outlines the project scope and objectives
2. Incorporates all requirements and evaluation metrics
3. Explains the evaluation criteria and their weightage
4. Includes budget considerations and timeline requirements
5. Maintains a professional and formal tone
6. Uses clear and unambiguous language`;

        const systemPrompt = "You are an expert in government procurement with extensive experience in writing RFPs. Focus on clarity, completeness, and compliance with procurement standards.";

        try {
            const response = await this.llm.generateResponse(prompt, systemPrompt, {
                temperature: 0.3,
                maxTokens: 2048
            });

            if (response.error) {
                throw new Error(`Failed to generate RFP description: ${response.error}`);
            }

            return response.text;
        } catch (error) {
            console.error('Error generating RFP description:', error);
            throw new Error('Failed to generate RFP description');
        }
    }

    private chunkText(text: string): string[] {
        // Split text into paragraphs
        const paragraphs = text.split(/\n\s*\n/);
        const chunks: string[] = [];
        let currentChunk = '';
        let currentTokens = 0;
        const maxTokens = this.MAX_SECTION_TOKENS - this.CHUNK_OVERLAP;

        for (const paragraph of paragraphs) {
            const tokens = encode(paragraph);
            
            if (currentTokens + tokens.length > maxTokens) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    // Keep last part for overlap
                    const overlapText = decode(encode(currentChunk).slice(-this.CHUNK_OVERLAP));
                    currentChunk = overlapText + '\n\n';
                    currentTokens = encode(currentChunk).length;
                }
            }
            
            currentChunk += paragraph + '\n\n';
            currentTokens = encode(currentChunk).length;
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    async extractRfpInfo(documentContent: string): Promise<DynamicRfpInfo> {
        try {
            if (!documentContent || documentContent.trim().length === 0) {
                throw new Error("Empty document content");
            }

            console.log("Starting RFP information extraction...");
            
            // Split document into chunks with overlap
            const chunks = this.chunkText(documentContent);
            console.log(`Document split into ${chunks.length} chunks`);

            // Classify chunks
            const classifiedChunks = await this.embeddings.classifyChunks(chunks);
            console.log("Chunks classified by category");

            // Create embeddings for classified chunks
            const embeddings = await this.embeddings.createEmbeddings(
                classifiedChunks.map(chunk => chunk.content)
            );

            // Add documents to vector store with metadata
            for (let i = 0; i < classifiedChunks.length; i++) {
                await this.vectorStore.addDocument({
                    id: `chunk-${i}`,
                    content: classifiedChunks[i].content,
                    embedding: embeddings[i],
                    metadata: {
                        category: classifiedChunks[i].category,
                        confidence: classifiedChunks[i].confidence
                    }
                });
            }

            const rfpInfo: DynamicRfpInfo = {};

            // Extract basic information first
            const basicInfo = await this.extractBasicInfo(classifiedChunks);
            Object.assign(rfpInfo, basicInfo);

            // Extract requirements dynamically
            rfpInfo.requirements = await this.extractRequirements(classifiedChunks);

            // Extract evaluation metrics dynamically
            rfpInfo.evaluationMetrics = await this.extractEvaluationMetrics(classifiedChunks);

            // Clean up vector store
            await this.vectorStore.clear();
            console.log("RFP information extraction completed successfully");

            return rfpInfo;
        } catch (error: unknown) {
            console.error("RFP information extraction error:", error);
            await this.vectorStore.clear();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`RFP information extraction failed: ${errorMessage}`);
        }
    }

    private async extractBasicInfo(classifiedChunks: ChunkMetadata[]): Promise<Partial<DynamicRfpInfo>> {
        // Filter chunks to only include the most relevant ones for basic info
        const relevantCategories = [
            "Background Information", 
            "Timeline", 
            "Budget Information", 
            "Submission Guidelines"
        ];
        
        // Get chunks from relevant categories + first chunk (often contains title/overview)
        const relevantChunks = classifiedChunks.filter(chunk => 
            chunk.category && relevantCategories.includes(chunk.category)
        );
        
        // Always include the first chunk as it often contains the title
        if (classifiedChunks.length > 0 && !relevantChunks.includes(classifiedChunks[0])) {
            relevantChunks.unshift(classifiedChunks[0]);
        }
        
        // Limit to 5 most relevant chunks to avoid token limits
        const limitedChunks = relevantChunks.slice(0, 5);
        
        const basicInfoPrompt = `
Analyze these document sections to extract basic RFP information.

Relevant sections:
${limitedChunks.map(chunk => chunk.content).join('\n\n')}

Extract the following in JSON format:
{
    "title": "Main project title",
    "shortDescription": "Brief project overview (1-2 sentences)",
    "timeline": {
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD"
    },
    "budget": number,
    "submissionDeadline": "YYYY-MM-DD"
}

IMPORTANT: Your response must be valid JSON. Use null for missing values.`;

        try {
            const response = await this.llm.generateResponse(
                basicInfoPrompt,
                "You are an expert in analyzing RFP documents. Extract precise information in valid JSON format only.",
                { responseFormat: "json_object" }
            );

            if (response.error) {
                console.warn(`Failed to extract basic information: ${response.error}`);
                return {
                    title: "Unknown Title",
                    shortDescription: "No description available"
                };
            }

            try {
                const basicInfo = JSON.parse(response.text);
                
                // Convert dates to Date objects if they exist
                if (basicInfo.timeline) {
                    if (basicInfo.timeline.startDate && basicInfo.timeline.startDate !== "YYYY-MM-DD") {
                        try {
                            basicInfo.timeline.startDate = new Date(basicInfo.timeline.startDate);
                        } catch (e) {
                            console.warn("Invalid startDate format:", basicInfo.timeline.startDate);
                            basicInfo.timeline.startDate = null;
                        }
                    } else {
                        basicInfo.timeline.startDate = null;
                    }
                    
                    if (basicInfo.timeline.endDate && basicInfo.timeline.endDate !== "YYYY-MM-DD") {
                        try {
                            basicInfo.timeline.endDate = new Date(basicInfo.timeline.endDate);
                        } catch (e) {
                            console.warn("Invalid endDate format:", basicInfo.timeline.endDate);
                            basicInfo.timeline.endDate = null;
                        }
                    } else {
                        basicInfo.timeline.endDate = null;
                    }
                }
                
                if (basicInfo.submissionDeadline && basicInfo.submissionDeadline !== "YYYY-MM-DD") {
                    try {
                        basicInfo.submissionDeadline = new Date(basicInfo.submissionDeadline);
                    } catch (e) {
                        console.warn("Invalid submissionDeadline format:", basicInfo.submissionDeadline);
                        basicInfo.submissionDeadline = null;
                    }
                } else {
                    basicInfo.submissionDeadline = null;
                }

                return basicInfo;
            } catch (error) {
                console.error('Failed to parse basic info JSON:', error);
                return {
                    title: "Unknown Title",
                    shortDescription: "No description available"
                };
            }
        } catch (error) {
            console.error('Error extracting basic info:', error);
            return {
                title: "Unknown Title",
                shortDescription: "No description available"
            };
        }
    }

    private async extractRequirements(classifiedChunks: ChunkMetadata[]): Promise<DynamicRfpInfo['requirements']> {
        // Filter chunks to only include the most relevant ones for requirements
        const relevantCategories = [
            "Requirements", 
            "Technical Specifications", 
            "Technical Requirements", 
            "Management Requirements",
            "Legal Requirements"
        ];
        
        // Get chunks from relevant categories
        const relevantChunks = classifiedChunks.filter(chunk => 
            chunk.category && relevantCategories.includes(chunk.category)
        );
        
        // Limit to 5 most relevant chunks to avoid token limits
        const limitedChunks = relevantChunks.slice(0, 5);
        
        // If no relevant chunks found, return empty structure
        if (limitedChunks.length === 0) {
            return {
                categories: {},
                uncategorized: []
            };
        }

        const requirementsPrompt = `
Analyze these document sections to extract RFP requirements.

Relevant sections:
${limitedChunks.map(chunk => chunk.content).join('\n\n')}

Extract and categorize requirements in JSON format:
{
    "categories": {
        "category1": ["requirement1", "requirement2"],
        "category2": ["requirement3", "requirement4"]
    },
    "uncategorized": ["requirement5", "requirement6"]
}

Common categories include: Technical, Functional, Management, Legal, Compliance, etc.
IMPORTANT: Your response must be valid JSON.`;

        try {
            const response = await this.llm.generateResponse(
                requirementsPrompt,
                "You are an expert in analyzing RFP documents. Extract precise requirements in valid JSON format only.",
                { responseFormat: "json_object" }
            );

            if (response.error) {
                console.warn(`Failed to extract requirements: ${response.error}`);
                return {
                    categories: {},
                    uncategorized: []
                };
            }

            try {
                const requirements = JSON.parse(response.text);
                
                // Validate structure
                if (!requirements.categories) requirements.categories = {};
                if (!requirements.uncategorized) requirements.uncategorized = [];
                
                return requirements;
            } catch (error) {
                console.warn('Failed to parse requirements JSON:', error);
                return {
                    categories: {},
                    uncategorized: []
                };
            }
        } catch (error) {
            console.warn('Error extracting requirements:', error);
            return {
                categories: {},
                uncategorized: []
            };
        }
    }

    private async extractEvaluationMetrics(classifiedChunks: ChunkMetadata[]): Promise<DynamicRfpInfo['evaluationMetrics']> {
        // Filter chunks to only include the most relevant ones for evaluation metrics
        const relevantCategories = [
            "Evaluation Criteria"
        ];
        
        // Get chunks from relevant categories
        const relevantChunks = classifiedChunks.filter(chunk => 
            chunk.category && relevantCategories.includes(chunk.category)
        );
        
        // Limit to 3 most relevant chunks to avoid token limits
        const limitedChunks = relevantChunks.slice(0, 3);
        
        // If no relevant chunks found, return empty structure
        if (limitedChunks.length === 0) {
            return {
                categories: {},
                uncategorized: []
            };
        }

        const metricsPrompt = `
Analyze these document sections to extract RFP evaluation metrics.

Relevant sections:
${limitedChunks.map(chunk => chunk.content).join('\n\n')}

Extract evaluation metrics in JSON format:
{
    "categories": {
        "category1": {
            "metric1": 30,
            "metric2": 20
        },
        "category2": {
            "metric3": 25,
            "metric4": 25
        }
    },
    "uncategorized": [
        {
            "name": "metric5",
            "weightage": 10,
            "description": "Optional description"
        }
    ]
}

The numbers represent weightage percentages. Total should add up to 100%.
IMPORTANT: Your response must be valid JSON.`;

        try {
            const response = await this.llm.generateResponse(
                metricsPrompt,
                "You are an expert in analyzing RFP documents. Extract precise evaluation metrics in valid JSON format only.",
                { responseFormat: "json_object" }
            );

            if (response.error) {
                console.warn(`Failed to extract evaluation metrics: ${response.error}`);
                return {
                    categories: {},
                    uncategorized: []
                };
            }

            try {
                const metrics = JSON.parse(response.text);
                
                // Validate structure
                if (!metrics.categories) metrics.categories = {};
                if (!metrics.uncategorized) metrics.uncategorized = [];
                
                return metrics;
            } catch (error) {
                console.warn('Failed to parse evaluation metrics JSON:', error);
                return {
                    categories: {},
                    uncategorized: []
                };
            }
        } catch (error) {
            console.warn('Error extracting evaluation metrics:', error);
            return {
                categories: {},
                uncategorized: []
            };
        }
    }
}

export const rfpGenerationService = new RfpGenerationService(); 