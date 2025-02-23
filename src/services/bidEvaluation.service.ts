import { GraniteEmbeddingService } from './granite/embedding.service';
import { GraniteLLMService } from './granite/llm.service';
import { Rfp } from "../models/Rfp";
import { Bid } from "../models/Bid";
import fs from 'fs';
import path from 'path';
import { VectorStore } from './vectorStore.service';
import pdfParse from "pdf-parse";

interface EvaluationResult {
    score: number;
    shortEvaluation: string;
    longEvaluation: string;
    details: {
        costEffectiveness: number;
        timeline: number;
        compliance: number;
        projectOverview: number;
        supplierQualifications: number;
        pricing: number;
        managementPlan: number;
        productEffectiveness: number;
        complianceMatrix: number;
        rfpAlignment: number;
        comments: {
            costEffectiveness?: string[];
            timeline?: string[];
            compliance?: string[];
            projectOverview?: string[];
            supplierQualifications?: string[];
            pricing?: string[];
            managementPlan?: string[];
            productEffectiveness?: string[];
            complianceMatrix?: string[];
            rfpAlignment?: string[];
        };
    };
}

type EvaluationMetric = keyof Omit<EvaluationResult['details'], 'comments'>;
type CommentKey = keyof EvaluationResult['details']['comments'];

interface QueryContext {
    metric: EvaluationMetric;
    query: string;
    weight: number;
}

export class BidEvaluationService {
    private embeddings: GraniteEmbeddingService;
    private llm: GraniteLLMService;
    private vectorStore: VectorStore;

    constructor() {
        this.embeddings = new GraniteEmbeddingService();
        this.llm = new GraniteLLMService();
        this.vectorStore = new VectorStore();
    }

    private getQueryContexts(): QueryContext[] {
        return [
            {
                metric: 'costEffectiveness',
                query: "Find sections discussing costs, budget, pricing, financial details, or value for money",
                weight: 0.15
            },
            {
                metric: 'timeline',
                query: "Find sections discussing project timeline, schedule, milestones, or delivery dates",
                weight: 0.10
            },
            {
                metric: 'compliance',
                query: "Find sections discussing compliance with RFP requirements, specifications, or standards",
                weight: 0.10
            },
            {
                metric: 'projectOverview',
                query: "Find sections discussing project approach, methodology, or solution overview",
                weight: 0.10
            },
            {
                metric: 'supplierQualifications',
                query: "Find sections discussing company experience, certifications, team qualifications, or past performance",
                weight: 0.15
            },
            {
                metric: 'pricing',
                query: "Find sections discussing pricing structure, cost breakdown, or payment terms",
                weight: 0.10
            },
            {
                metric: 'managementPlan',
                query: "Find sections discussing project management, team structure, or resource allocation",
                weight: 0.10
            },
            {
                metric: 'productEffectiveness',
                query: "Find sections discussing solution quality, technical specifications, or innovation",
                weight: 0.10
            },
            {
                metric: 'complianceMatrix',
                query: "Find sections discussing technical compliance, administrative compliance, or legal requirements",
                weight: 0.05
            },
            {
                metric: 'rfpAlignment',
                query: "Find sections discussing strategic alignment, goals, or success metrics",
                weight: 0.05
            }
        ];
    }

    private chunkText(text: string, maxChunkSize: number = 4000): string[] {
        const chunks: string[] = [];
        const paragraphs = text.split(/\n\n+/);
        let currentChunk = '';

        for (const paragraph of paragraphs) {
            if ((currentChunk + paragraph).length > maxChunkSize) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
                if (paragraph.length > maxChunkSize) {
                    const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
                    for (const sentence of sentences) {
                        if (currentChunk.length + sentence.length > maxChunkSize) {
                            if (currentChunk) {
                                chunks.push(currentChunk.trim());
                                currentChunk = '';
                            }
                        }
                        currentChunk += sentence;
                    }
                } else {
                    currentChunk = paragraph;
                }
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    async evaluateBid(bid: Bid, rfp: Rfp): Promise<EvaluationResult> {
        try {
            const filePath = path.join(process.cwd(), 'uploads/proposals', bid.proposalDocument);
            const pdfBuffer = fs.readFileSync(filePath);
            
            // Extract text from PDF using pdf-parse
            const pdfData = await pdfParse(pdfBuffer);
            const proposalContent = pdfData.text;
            console.log("PDF content extracted successfully, length:", proposalContent.length);

            // Split the document into sections and create embeddings
            const sections = this.chunkText(proposalContent);
            for (const [index, section] of sections.entries()) {
                const embedding = await this.embeddings.createEmbedding(section);
                await this.vectorStore.addDocument({
                    id: `section-${index}`,
                    content: section,
                    embedding
                });
            }

            let combinedEvaluation: EvaluationResult = {
                score: 0,
                shortEvaluation: '',
                longEvaluation: '',
                details: {
                    costEffectiveness: 0,
                    timeline: 0,
                    compliance: 0,
                    projectOverview: 0,
                    supplierQualifications: 0,
                    pricing: 0,
                    managementPlan: 0,
                    productEffectiveness: 0,
                    complianceMatrix: 0,
                    rfpAlignment: 0,
                    comments: {}
                }
            };

            // Evaluate each aspect using relevant sections
            for (const context of this.getQueryContexts()) {
                // Get relevant sections for this metric
                const relevantSections = await this.vectorStore.search(
                    await this.embeddings.createEmbedding(context.query),
                    3 // Get top 3 most relevant sections
                );

                const prompt = `
Analyze these sections of a bid proposal specifically focusing on ${context.metric} aspects:

RFP Details:
Title: ${rfp.title}
Description: ${rfp.shortDescription}
Budget: $${rfp.budget}
Timeline: ${rfp.timelineStartDate} to ${rfp.timelineEndDate}

Relevant sections from the proposal:
${relevantSections.map(section => section.content).join('\n\n')}

Evaluate these sections and provide:
1. A score (0-100) for the ${context.metric} aspects
2. Specific comments/feedback about ${context.metric}
3. Note if any critical information is missing

Format response as JSON:
{
    "score": number,
    "comments": string[],
    "evaluation": string
}`;

                const result = await this.llm.generateResponse(
                    prompt,
                    "You are an expert procurement bid evaluator. Provide detailed, objective evaluations with specific evidence.",
                    {
                        temperature: 0.3,
                        responseFormat: "json_object"
                    }
                );

                if (result.error) {
                    throw new Error(`Failed to evaluate criterion: ${result.error}`);
                }

                const evaluation = JSON.parse(result.text) as {
                    score: number;
                    comments: string[];
                    evaluation: string;
                };

                // Update combined evaluation
                combinedEvaluation.details[context.metric] = evaluation.score;
                combinedEvaluation.details.comments[context.metric as CommentKey] = evaluation.comments;
                combinedEvaluation.longEvaluation += `\n\n${context.metric.toUpperCase()}:\n${evaluation.evaluation}`;
            }

            // Calculate final weighted score
            combinedEvaluation.score = Math.round(
                this.getQueryContexts().reduce((total, context) => 
                    total + (combinedEvaluation.details[context.metric] * context.weight), 0)
            );

            // Generate short evaluation
            const shortEvalPrompt = `
Summarize this bid evaluation in 2-3 sentences (max 100 words):

Score: ${combinedEvaluation.score}/100

Key findings:
${combinedEvaluation.longEvaluation}`;

            const shortEvalResponse = await this.llm.generateResponse(
                shortEvalPrompt,
                "You are an expert procurement bid evaluator. Provide a concise summary.",
                {
                    temperature: 0.3,
                    maxTokens: 150
                }
            );

            if (shortEvalResponse.error) {
                throw new Error(`Failed to generate short evaluation: ${shortEvalResponse.error}`);
            }

            combinedEvaluation.shortEvaluation = shortEvalResponse.text;

            // Clean up vector store
            await this.vectorStore.clear();

            return combinedEvaluation;
        } catch (error) {
            console.error("Bid evaluation error:", error);
            // Clean up vector store in case of error
            await this.vectorStore.clear();
            throw new Error("Failed to evaluate bid proposal");
        }
    }
}

export const bidEvaluationService = new BidEvaluationService(); 