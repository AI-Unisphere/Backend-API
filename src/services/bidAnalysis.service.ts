import { GraniteEmbeddingService } from './granite/embedding.service';
import { GraniteLLMService } from './granite/llm.service';
import { VectorStore } from './vectorStore.service';
import pdfParse from 'pdf-parse';
import { Rfp } from '../models/Rfp';
import { Document } from '../types/document';

type SuggestionKey = 'budget' | 'technical' | 'timeline' | 'team' | 'documentation';

interface BidAnalysisResult {
    suggestions: {
        [K in SuggestionKey]?: string[];
    };
    isComplete: boolean;
    score: number;
}

interface QueryContext {
    aspect: SuggestionKey;
    query: string;
}

export class BidAnalysisService {
    private embeddings: GraniteEmbeddingService;
    private llm: GraniteLLMService;
    private vectorStore: VectorStore;

    constructor() {
        this.embeddings = new GraniteEmbeddingService();
        this.llm = new GraniteLLMService();
        this.vectorStore = new VectorStore();
    }

    private splitIntoSections(text: string): string[] {
        // Split document into logical sections (e.g., by headers, paragraphs)
        const sections = text.split(/\n(?=[A-Z][^a-z])/);
        return sections.filter(section => section.trim().length > 0);
    }

    private async createEmbeddings(sections: string[]): Promise<void> {
        try {
            // Create embeddings for all sections at once
            const embeddings = await this.embeddings.createEmbeddings(sections);
            
            // Add documents to vector store
            for (let i = 0; i < sections.length; i++) {
                const document: Document = {
                    id: `section-${i}`,
                    content: sections[i],
                    embedding: embeddings[i]
                };
                await this.vectorStore.addDocument(document);
            }
        } catch (error) {
            console.error('Error creating embeddings:', error);
            throw new Error('Failed to create embeddings for sections');
        }
    }

    private getQueryContexts(): QueryContext[] {
        return [
            {
                aspect: 'budget',
                query: "Find sections discussing budget, costs, pricing, financial details, or monetary aspects"
            },
            {
                aspect: 'technical',
                query: "Find sections discussing technical specifications, requirements, implementation details, or technical approach"
            },
            {
                aspect: 'timeline',
                query: "Find sections discussing project timeline, schedule, milestones, or delivery dates"
            },
            {
                aspect: 'team',
                query: "Find sections discussing team composition, roles, expertise, or staffing"
            },
            {
                aspect: 'documentation',
                query: "Find sections discussing documentation, deliverables, or required documents"
            }
        ];
    }

    async analyzeBidProposal(proposalFile: Buffer, _fileName: string, rfp: Rfp): Promise<BidAnalysisResult> {
        try {
            // Extract text from PDF using pdf-parse
            const pdfData = await pdfParse(proposalFile);
            const proposalContent = pdfData.text;
            console.log("PDF content extracted successfully, length:", proposalContent.length);
            
            // Split into sections
            const sections = this.splitIntoSections(proposalContent);
            
            // Create and store embeddings
            await this.createEmbeddings(sections);

            let combinedAnalysis: BidAnalysisResult = {
                suggestions: {},
                isComplete: true,
                score: 0
            };
            let aspectScores: Record<SuggestionKey, number[]> = {
                budget: [],
                technical: [],
                timeline: [],
                team: [],
                documentation: []
            };

            // Create embeddings for all queries at once
            const queryContexts = this.getQueryContexts();
            const queryEmbeddings = await this.embeddings.createEmbeddings(
                queryContexts.map(context => context.query)
            );

            // Analyze each aspect using relevant sections
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

                    const prompt = `
Analyze these sections of a bid proposal specifically focusing on ${context.aspect} aspects:

RFP Details:
- Title: ${rfp.title}
- Short Description: ${rfp.shortDescription}
- Budget: $${rfp.budget}
- Timeline: ${rfp.timelineStartDate} to ${rfp.timelineEndDate}

Relevant sections from the proposal:
${relevantSections.map(section => section.content).join('\n\n')}

Please analyze these sections and provide:
1. Specific suggestions for improvement related to ${context.aspect}
2. Whether the ${context.aspect} information appears complete
3. A score (0-100) for the ${context.aspect} aspects

Format response as JSON:
{
    "suggestions": string[],
    "isComplete": boolean,
    "score": number
}`;

                    const systemPrompt = "You are an expert in analyzing government procurement proposals. Focus on providing clear, actionable suggestions for improvement.";

                    const response = await this.llm.generateResponse(
                        prompt,
                        systemPrompt,
                        {
                            temperature: 0.3,
                            responseFormat: "json_object"
                        }
                    );

                    if (response.error) {
                        throw new Error(`Failed to analyze ${context.aspect}: ${response.error}`);
                    }

                    const result = JSON.parse(response.text) as {
                        suggestions: string[];
                        isComplete: boolean;
                        score: number;
                    };

                    // Add suggestions to combined analysis
                    if (!combinedAnalysis.suggestions[context.aspect]) {
                        combinedAnalysis.suggestions[context.aspect] = [];
                    }
                    combinedAnalysis.suggestions[context.aspect]!.push(...result.suggestions);

                    // Track completeness and scores
                    combinedAnalysis.isComplete = combinedAnalysis.isComplete && result.isComplete;
                    aspectScores[context.aspect].push(result.score);
                } catch (error) {
                    console.error(`Error processing aspect ${context.aspect}:`, error);
                    throw new Error(`Failed to process aspect ${context.aspect}`);
                }
            }

            // Calculate final scores for each aspect
            const finalScores = Object.entries(aspectScores).reduce((acc, [aspect, scores]) => {
                acc[aspect as SuggestionKey] = scores.length > 0
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : 0;
                return acc;
            }, {} as Record<SuggestionKey, number>);

            // Calculate overall score (weighted average)
            const weights = {
                budget: 0.25,
                technical: 0.25,
                timeline: 0.20,
                team: 0.20,
                documentation: 0.10
            };

            combinedAnalysis.score = Math.round(
                Object.entries(finalScores).reduce((total, [aspect, score]) => 
                    total + (score * weights[aspect as SuggestionKey]), 0)
            );

            // Clean up vector store
            await this.vectorStore.clear();

            return combinedAnalysis;
        } catch (error) {
            console.error("Bid analysis error:", error);
            // Clean up vector store in case of error
            await this.vectorStore.clear();
            throw new Error("Failed to analyze bid proposal");
        }
    }
}

export const bidAnalysisService = new BidAnalysisService(); 