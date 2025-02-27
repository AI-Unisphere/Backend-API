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
        const basicInfoPrompt = `
Analyze these document sections to extract basic RFP information.

Relevant sections:
${classifiedChunks.map(chunk => chunk.content).join('\n\n')}

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
}`;

        const response = await this.llm.generateResponse(
            basicInfoPrompt,
            "You are an expert in analyzing RFP documents. Extract precise information.",
            { responseFormat: "json_object" }
        );

        if (response.error) {
            throw new Error(`Failed to extract basic information: ${response.error}`);
        }

        const basicInfo = JSON.parse(response.text);
        
        // Convert dates to Date objects
        if (basicInfo.timeline) {
            basicInfo.timeline.startDate = basicInfo.timeline.startDate ? new Date(basicInfo.timeline.startDate) : undefined;
            basicInfo.timeline.endDate = basicInfo.timeline.endDate ? new Date(basicInfo.timeline.endDate) : undefined;
        }
        if (basicInfo.submissionDeadline) {
            basicInfo.submissionDeadline = new Date(basicInfo.submissionDeadline);
        }

        return basicInfo;
    }

    private async extractRequirements(classifiedChunks: ChunkMetadata[]): Promise<DynamicRfpInfo['requirements']> {
        // Filter chunks related to requirements
        const requirementChunks = classifiedChunks.filter(chunk => 
            chunk.category?.includes('Requirements') || 
            chunk.category?.includes('Technical Specifications')
        );

        if (requirementChunks.length === 0) {
            return { categories: {}, uncategorized: [] };
        }

        const requirementsPrompt = `
Analyze these requirement sections and extract all requirements dynamically.
Group requirements into categories if they exist, otherwise list them as uncategorized.

Relevant sections:
${requirementChunks.map(chunk => chunk.content).join('\n\n')}

Extract requirements in JSON format:
{
    "categories": {
        "category_name": ["requirement1", "requirement2"]
    },
    "uncategorized": ["requirement1", "requirement2"]
}`;

        const response = await this.llm.generateResponse(
            requirementsPrompt,
            "You are an expert in analyzing RFP requirements. Group requirements logically.",
            { responseFormat: "json_object" }
        );

        if (response.error) {
            throw new Error(`Failed to extract requirements: ${response.error}`);
        }

        return JSON.parse(response.text);
    }

    private async extractEvaluationMetrics(classifiedChunks: ChunkMetadata[]): Promise<DynamicRfpInfo['evaluationMetrics']> {
        // Filter chunks related to evaluation
        const evaluationChunks = classifiedChunks.filter(chunk => 
            chunk.category?.includes('Evaluation')
        );

        if (evaluationChunks.length === 0) {
            return { categories: {}, uncategorized: [] };
        }

        const evaluationPrompt = `
Analyze these sections to extract evaluation metrics and their weights.
Group metrics into categories if they exist, otherwise list them as uncategorized.

Relevant sections:
${evaluationChunks.map(chunk => chunk.content).join('\n\n')}

Extract metrics in JSON format:
{
    "categories": {
        "category_name": {
            "metric_name": weight_number
        }
    },
    "uncategorized": ["metric_description (weight%)"]
}`;

        const response = await this.llm.generateResponse(
            evaluationPrompt,
            "You are an expert in analyzing RFP evaluation criteria. Extract precise metrics and weights.",
            { responseFormat: "json_object" }
        );

        if (response.error) {
            throw new Error(`Failed to extract evaluation metrics: ${response.error}`);
        }

        return JSON.parse(response.text);
    }
}

export const rfpGenerationService = new RfpGenerationService(); 