import { GraniteEmbeddingService, ChunkMetadata } from './granite/embedding.service';
import { GraniteLLMService } from './granite/llm.service';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

// Define the structure for RFP information
export interface DynamicRfpInfo {
    title: string;
    shortDescription: string;
    timeline?: {
        startDate?: Date | null;
        endDate?: Date | null;
    };
    budget?: number | null;
    submissionDeadline?: Date | null;
    requirements: {
        categories: { [category: string]: string[] };
        uncategorized: string[];
    };
    evaluationMetrics: {
        categories: { [category: string]: { [metric: string]: number } };
        uncategorized: { name: string; weightage: number; description?: string }[];
    };
    specialInstructions?: string | null;
}

// Input for RFP generation
export interface RfpInput {
    title: string;
    description: string;
    industry: string;
    budget?: number;
    timeline?: string;
}

// Input for RFP description generation
export interface RfpDescriptionInput {
    title: string;
    shortDescription: string;
    timeline?: string;
    budget?: number | null;
    submissionDeadline?: Date | null;
    categoryId?: number;
    requirements?: any;
    evaluationMetrics?: any;
    specialInstructions?: string;
}

export class RfpGenerationService {
    private readonly categories = [
        "Technical Requirements",
        "Functional Requirements",
        "Project Timeline",
        "Budget",
        "Evaluation Criteria",
        "Submission Guidelines",
        "Legal Requirements",
        "Vendor Qualifications",
        "Special Instructions",
        "Background Information",
        "Scope of Work",
        "Deliverables"
    ];
    
    private embedding: GraniteEmbeddingService;
    private llm: GraniteLLMService;

    constructor() {
        this.embedding = new GraniteEmbeddingService();
        this.llm = new GraniteLLMService();
    }

    // Extract text from a PDF file
    private async extractTextFromPdf(filePath: string): Promise<string> {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            return pdfData.text;
        } catch (error: any) {
            console.error(`Error extracting text from PDF ${filePath}:`, error);
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }

    // Read a text file
    private async readTextFile(filePath: string): Promise<string> {
        try {
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
            return fileContent;
        } catch (error: any) {
            console.error(`Error reading text file ${filePath}:`, error);
            throw new Error(`Failed to read text file: ${error.message}`);
        }
    }

    // Read file based on extension
    private async readFile(filePath: string): Promise<string> {
        const extension = path.extname(filePath).toLowerCase();
        
        if (extension === '.pdf') {
            return this.extractTextFromPdf(filePath);
        } else if (['.txt', '.md', '.html', '.htm', '.xml', '.json'].includes(extension)) {
            return this.readTextFile(filePath);
        } else {
            throw new Error(`Unsupported file type: ${extension}`);
        }
    }

    // Split text into chunks of approximately equal size
    private chunkText(text: string, chunkSize: number = 1000): string[] {
        const chunks: string[] = [];
        let currentChunk = '';
        
        // Split by paragraphs first
        const paragraphs = text.split(/\n\s*\n/);
        
        for (const paragraph of paragraphs) {
            // If paragraph is too long, split by sentences
            if (paragraph.length > chunkSize) {
                const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
                
                for (const sentence of sentences) {
                    if (currentChunk.length + sentence.length <= chunkSize) {
                        currentChunk += sentence;
                    } else {
                        if (currentChunk) {
                            chunks.push(currentChunk.trim());
                        }
                        currentChunk = sentence;
                    }
                }
            } else {
                // If adding this paragraph exceeds chunk size, start a new chunk
                if (currentChunk.length + paragraph.length > chunkSize) {
                    chunks.push(currentChunk.trim());
                    currentChunk = paragraph;
                } else {
                    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
                }
            }
        }
        
        // Add the last chunk if it's not empty
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }

    // Extract information from an RFP document
    async extractRfpInfo(filePath: string): Promise<DynamicRfpInfo> {
        try {
            console.log('Reading file:', filePath);
            const text = await this.readFile(filePath);
            
            if (!text || text.trim().length === 0) {
                throw new Error('No text content extracted from file');
            }
            
            console.log(`Extracted ${text.length} characters from file`);
            
            // Split text into manageable chunks
            const textChunks = this.chunkText(text);
            console.log(`Split text into ${textChunks.length} chunks`);
            
            // Convert string chunks to ChunkMetadata objects
            const chunks: ChunkMetadata[] = textChunks.map(content => ({ content }));
            
            // Classify chunks by category
            console.log('Classifying document chunks...');
            const classifiedChunks = await this.embedding.classifyChunks(chunks, this.categories);
            
            // Extract RFP information from classified chunks
            console.log('Extracting RFP information...');
            const basicInfo = await this.extractBasicInfo(classifiedChunks);
            const requirements = await this.extractRequirements(classifiedChunks);
            const evaluationMetrics = await this.extractEvaluationMetrics(classifiedChunks);
            const specialInstructions = await this.extractSpecialInstructions(classifiedChunks);
            
            console.log('RFP information extraction completed successfully');
            
            return {
                ...basicInfo,
                requirements,
                evaluationMetrics,
                specialInstructions
            } as DynamicRfpInfo;
        } catch (error: any) {
            console.error('Error extracting RFP information:', error);
            throw new Error(`Failed to extract RFP information: ${error.message}`);
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

    // Extract special instructions from classified chunks
    private async extractSpecialInstructions(chunks: ChunkMetadata[]): Promise<string | null> {
        // Filter chunks that might contain special instructions
        const relevantCategories = [
            "Submission Guidelines",
            "Legal Requirements",
            "Special Instructions"
        ];
        
        const relevantChunks = chunks.filter(chunk => 
            chunk.category && relevantCategories.includes(chunk.category)
        );
        
        // Limit to 3 most relevant chunks to avoid token limits
        const limitedChunks = relevantChunks.slice(0, 3);
        
        // If no relevant chunks found, return null
        if (limitedChunks.length === 0) {
            return null;
        }

        const instructionsPrompt = `
Analyze these document sections to extract any special instructions or guidelines for RFP submission.

Relevant sections:
${limitedChunks.map(chunk => chunk.content).join('\n\n')}

Extract any special instructions, submission guidelines, or legal requirements that bidders need to follow.
Format your response as a clear, concise list of instructions. If no special instructions are found, respond with "No special instructions provided."
`;

        try {
            const response = await this.llm.generateResponse(
                instructionsPrompt,
                "You are an expert in analyzing RFP documents. Extract special instructions and submission guidelines in a clear, concise format.",
                { temperature: 0.3 }
            );

            if (response.error) {
                console.warn(`Failed to extract special instructions: ${response.error}`);
                return null;
            }

            const instructions = response.text.trim();
            
            // If no instructions found or default response
            if (instructions === "No special instructions provided." || instructions.length < 10) {
                return null;
            }
            
            return instructions;
        } catch (error) {
            console.warn('Failed to extract special instructions:', error);
            return null;
        }
    }

    // Generate a comprehensive RFP description based on provided information
    public async generateRfpDescription(input: RfpDescriptionInput): Promise<string> {
        try {
            const prompt = `
            Generate a comprehensive and professional Request for Proposal (RFP) description based on the following information:
            
            Title: ${input.title}
            Short Description: ${input.shortDescription}
            ${input.timeline ? `Timeline: ${input.timeline}` : ''}
            ${input.budget ? `Budget: $${input.budget}` : ''}
            ${input.submissionDeadline ? `Submission Deadline: ${input.submissionDeadline.toISOString().split('T')[0]}` : ''}
            
            Requirements:
            ${JSON.stringify(input.requirements || {})}
            
            Evaluation Metrics:
            ${JSON.stringify(input.evaluationMetrics || {})}
            
            ${input.specialInstructions ? `Special Instructions: ${input.specialInstructions}` : ''}
            
            The RFP description should include:
            1. A detailed introduction and background
            2. Clear explanation of the project scope
            3. Detailed requirements and specifications
            4. Timeline and milestones
            5. Budget constraints and payment terms
            6. Evaluation criteria and selection process
            7. Submission guidelines and contact information
            8. Any special terms or conditions
            
            Format the response as a well-structured, professional document with appropriate sections and headings.
            `;
            
            const systemPrompt = "You are an expert in creating professional Request for Proposal documents. Generate a comprehensive RFP based on the provided information.";
            
            const response = await this.llm.generateResponse(
                prompt,
                systemPrompt,
                {
                    temperature: 0.7,
                    maxTokens: 2000
                }
            );
            
            return response.text;
        } catch (error: any) {
            console.error('Error generating RFP description:', error);
            // Return a basic description if generation fails
            return `Request for Proposal: ${input.title}\n\n${input.shortDescription}\n\nPlease refer to the requirements and evaluation metrics for more details.`;
        }
    }
}

// Create and export a singleton instance
export const rfpGenerationService = new RfpGenerationService();