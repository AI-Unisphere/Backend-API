import { GraniteEmbeddingService } from './granite/embedding.service';
import { GraniteLLMService } from './granite/llm.service';
import { VectorStore } from './vectorStore.service';
import { encode, decode } from 'gpt-tokenizer';

interface RfpInput {
    title: string;
    shortDescription: string;
    technicalRequirements?: string[];
    managementRequirements?: string[];
    pricingDetails?: string;
    evaluationCriteria?: {
        metrics: Array<{ name: string; weightage: number; }>;
    };
    budget: number;
    specialInstructions?: string;
}

interface RfpInfo {
    title?: string;
    shortDescription?: string;
    longDescription?: string;
    budget?: number;
    timelineStartDate?: Date;
    timelineEndDate?: Date;
    submissionDeadline?: Date;
    technicalRequirements?: string[];
    managementRequirements?: string[];
    pricingDetails?: string[];
    evaluationCriteria?: string[];
    specialInstructions?: string[];
}

interface QueryContext {
    aspect: keyof RfpInfo;
    query: string;
}

export class RfpGenerationService {
    private embeddings: GraniteEmbeddingService;
    private llm: GraniteLLMService;
    private vectorStore: VectorStore;
    private readonly MAX_SECTION_TOKENS = 2000; // Limit tokens per section to ensure we stay within context limits

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

Technical Requirements:
${input.technicalRequirements?.map(r => `- ${r}`).join('\n') || 'Not specified'}

Management Requirements:
${input.managementRequirements?.map(r => `- ${r}`).join('\n') || 'Not specified'}

Pricing Details:
${input.pricingDetails || 'Not specified'}

Evaluation Criteria:
${input.evaluationCriteria?.metrics.map(m => `- ${m.name} (${m.weightage}%)`).join('\n') || 'Not specified'}

Special Instructions:
${input.specialInstructions || 'None'}

Please generate a comprehensive, well-structured RFP description that:
1. Clearly outlines the project scope and objectives
2. Incorporates all technical and management requirements
3. Explains the evaluation criteria and their weightage
4. Includes budget considerations and pricing requirements
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

    async extractRfpInfo(documentContent: string): Promise<RfpInfo> {
        try {
            if (!documentContent || documentContent.trim().length === 0) {
                throw new Error("Empty document content");
            }

            console.log("Starting RFP information extraction...");
            
            // Split the document into sections and create embeddings
            const sections = this.chunkText(documentContent);
            console.log(`Document split into ${sections.length} sections`);

            try {
                // Create embeddings for all sections at once
                const embeddings = await this.embeddings.createEmbeddings(sections);
                
                // Add all documents to vector store
                for (let i = 0; i < sections.length; i++) {
                    await this.vectorStore.addDocument({
                        id: `section-${i}`,
                        content: sections[i],
                        embedding: embeddings[i]
                    });
                }
            } catch (error: any) {
                console.error("Error processing sections:", error);
                throw new Error(`Failed to process document sections: ${error.message}`);
            }

            const rfpInfo: RfpInfo = {};

            // Create embeddings for all queries at once
            const queryContexts = this.getQueryContexts();
            const queryEmbeddings = await this.embeddings.createEmbeddings(
                queryContexts.map(context => context.query)
            );

            // Extract information for each aspect using relevant sections
            for (let i = 0; i < queryContexts.length; i++) {
                const context = queryContexts[i];
                try {
                    console.log(`Processing aspect: ${context.aspect}`);
                    
                    // Get relevant sections for this aspect using pre-computed embedding
                    const relevantSections = await this.vectorStore.search(
                        queryEmbeddings[i],
                        3 // Get top 3 most relevant sections
                    );

                    console.log(`Found ${relevantSections.length} relevant sections for ${context.aspect}`);

                    // Truncate sections to fit within context limit
                    const truncatedSections = relevantSections.map(section => ({
                        ...section,
                        content: this.truncateText(section.content, this.MAX_SECTION_TOKENS)
                    }));

                    const prompt = `
Analyze these sections of a document to extract information about the ${context.aspect}:

Relevant sections:
${truncatedSections.map(section => section.content).join('\n\n')}

Extract the following information about ${context.aspect}:
${this.getExtractionInstructions(context.aspect)}

Format response as JSON:
${this.getResponseFormat(context.aspect)}`;

                    const systemPrompt = "You are an expert in analyzing RFP documents and extracting structured information. Be precise and factual.";
                    
                    const response = await this.llm.generateResponse(
                        prompt,
                        systemPrompt,
                        {
                            temperature: 0.3,
                            responseFormat: "json_object"
                        }
                    );

                    if (response.error) {
                        throw new Error(`Failed to extract ${context.aspect}: ${response.error}`);
                    }

                    this.updateRfpInfo(rfpInfo, context.aspect, JSON.parse(response.text));
                } catch (error: any) {
                    console.error(`Error processing aspect ${context.aspect}:`, error);
                    throw new Error(`Failed to process aspect ${context.aspect}: ${error?.message || 'Unknown error'}`);
                }
            }

            // Clean up vector store
            await this.vectorStore.clear();
            console.log("RFP information extraction completed successfully");

            return rfpInfo;
        } catch (error: any) {
            console.error("RFP information extraction error:", error);
            // Clean up vector store in case of error
            await this.vectorStore.clear();
            throw new Error(`RFP information extraction failed: ${error?.message || 'Unknown error'}`);
        }
    }

    private chunkText(text: string): string[] {
        // Split text into manageable chunks
        const chunks = text.split(/(?=\n\s*\n)/); // Split on double newlines
        return chunks.map(chunk => chunk.trim()).filter(chunk => chunk.length > 0);
    }

    private truncateText(text: string, maxTokens: number): string {
        const tokens = encode(text);
        if (tokens.length <= maxTokens) {
            return text;
        }
        return decode(tokens.slice(0, maxTokens));
    }

    private updateRfpInfo(rfpInfo: RfpInfo, aspect: keyof RfpInfo, extractedInfo: any) {
        if (aspect.includes('Date') && typeof extractedInfo === 'string') {
            // Type assertion to handle the Date case
            (rfpInfo[aspect] as Date | undefined) = new Date(extractedInfo);
        } else {
            // Type assertion for other cases
            (rfpInfo[aspect] as any) = extractedInfo;
        }
    }

    private getQueryContexts(): QueryContext[] {
        return [
            {
                aspect: 'title',
                query: "Find sections discussing the project title, name, or main objective"
            },
            {
                aspect: 'shortDescription',
                query: "Find sections providing a brief overview or summary of the project"
            },
            {
                aspect: 'longDescription',
                query: "Find sections detailing project scope, objectives, and detailed requirements"
            },
            {
                aspect: 'budget',
                query: "Find sections discussing budget, costs, financial details, or funding"
            },
            {
                aspect: 'timelineStartDate',
                query: "Find sections discussing project start date or kickoff"
            },
            {
                aspect: 'timelineEndDate',
                query: "Find sections discussing project end date or completion"
            },
            {
                aspect: 'submissionDeadline',
                query: "Find sections discussing proposal submission deadline or due date"
            },
            {
                aspect: 'technicalRequirements',
                query: "Find sections listing technical specifications, requirements, or standards"
            },
            {
                aspect: 'managementRequirements',
                query: "Find sections discussing project management, team, or organizational requirements"
            },
            {
                aspect: 'pricingDetails',
                query: "Find sections about pricing structure, payment terms, or cost breakdown requirements"
            },
            {
                aspect: 'evaluationCriteria',
                query: "Find sections detailing evaluation criteria, scoring, or selection process"
            },
            {
                aspect: 'specialInstructions',
                query: "Find sections listing special instructions or important notes"
            }
        ];
    }

    private getExtractionInstructions(aspect: keyof RfpInfo): string {
        const instructions: Record<keyof RfpInfo, string> = {
            title: "Extract the main project title or name. If multiple titles exist, choose the most comprehensive one.",
            shortDescription: "Extract or generate a brief (1-2 sentences) overview of the project.",
            longDescription: "Extract or compile a detailed description of the project scope and requirements.",
            budget: "Extract the total budget amount as a number. Remove currency symbols and formatting.",
            timelineStartDate: "Extract the project start date in ISO format (YYYY-MM-DD).",
            timelineEndDate: "Extract the project end date in ISO format (YYYY-MM-DD).",
            submissionDeadline: "Extract the proposal submission deadline in ISO format (YYYY-MM-DD).",
            technicalRequirements: "Extract a list of technical requirements or specifications.",
            managementRequirements: "Extract a list of project management and organizational requirements.",
            pricingDetails: "Extract a list of pricing requirements and payment terms.",
            evaluationCriteria: "Extract a list of evaluation criteria or scoring factors.",
            specialInstructions: "Extract a list of special instructions or important notes."
        };
        return instructions[aspect];
    }

    private getResponseFormat(aspect: keyof RfpInfo): string {
        const formats: Record<keyof RfpInfo, string> = {
            title: '{"title": "string"}',
            shortDescription: '{"shortDescription": "string"}',
            longDescription: '{"longDescription": "string"}',
            budget: '{"budget": number}',
            timelineStartDate: '{"timelineStartDate": "YYYY-MM-DD"}',
            timelineEndDate: '{"timelineEndDate": "YYYY-MM-DD"}',
            submissionDeadline: '{"submissionDeadline": "YYYY-MM-DD"}',
            technicalRequirements: '{"technicalRequirements": ["requirement1", "requirement2", ...]}',
            managementRequirements: '{"managementRequirements": ["requirement1", "requirement2", ...]}',
            pricingDetails: '{"pricingDetails": ["detail1", "detail2", ...]}',
            evaluationCriteria: '{"evaluationCriteria": ["criterion1", "criterion2", ...]}',
            specialInstructions: '{"specialInstructions": ["instruction1", "instruction2", ...]}'
        };
        return formats[aspect];
    }
}

export const rfpGenerationService = new RfpGenerationService(); 