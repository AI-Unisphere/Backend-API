import { GraniteEmbeddingService, ChunkMetadata } from './granite/embedding.service';
import { GraniteLLMService } from './granite/llm.service';
import { Rfp } from "../models/Rfp";
import { Bid } from "../models/Bid";
import fs from 'fs';
import path from 'path';
import { VectorStore } from './vectorStore.service';
import pdfParse from "pdf-parse";
import { encode, decode } from 'gpt-tokenizer';

interface EvaluationResult {
    score: number;
    shortEvaluation: string;
    longEvaluation: string;
    details: {
        rfpSpecificCriteria: {
            categories: Record<string, {
                score: number;
                maxScore: number;
                comments: string[];
                strengths: string[];
                weaknesses: string[];
                requirementsCoverage: {
                    met: string[];
                    partial: string[];
                    missing: string[];
                };
            }>;
            uncategorized: Array<{
                criterion: string;
                score: number;
                maxScore: number;
                comments: string[];
                requirementsCoverage: {
                    met: string[];
                    partial: string[];
                    missing: string[];
                };
            }>;
        };
        genericCriteria: {
            technicalCapability: {
                score: number;
                strengths: string[];
                weaknesses: string[];
                details: Record<string, number>;
            };
            projectManagement: {
                score: number;
                strengths: string[];
                weaknesses: string[];
                details: Record<string, number>;
            };
            riskAssessment: {
                level: 'LOW' | 'MEDIUM' | 'HIGH';
                risks: Array<{
                    area: string;
                    description: string;
                    severity: 'LOW' | 'MEDIUM' | 'HIGH';
                    mitigation: string;
                }>;
            };
            compliance: {
                score: number;
                metRequirements: string[];
                gaps: string[];
            };
        };
        overallAssessment: {
            strengths: string[];
            weaknesses: string[];
            recommendations: string[];
        };
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
            strengths: string[];
            weaknesses: string[];
            recommendations: string[];
        };
    };
}

export class BidEvaluationService {
    private embeddings: GraniteEmbeddingService;
    private llm: GraniteLLMService;
    private vectorStore: VectorStore;
    private readonly MAX_SECTION_TOKENS = 2000;
    private readonly CHUNK_OVERLAP = 100;

    constructor() {
        this.embeddings = new GraniteEmbeddingService();
        this.llm = new GraniteLLMService();
        this.vectorStore = new VectorStore();
    }

    private chunkText(text: string): string[] {
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

    async evaluateBid(bid: Bid, rfp: Rfp): Promise<EvaluationResult> {
        try {
            const filePath = path.join(process.cwd(), 'uploads/proposals', bid.proposalDocument);
            const pdfBuffer = fs.readFileSync(filePath);

            const pdfData = await pdfParse(pdfBuffer);
            const proposalContent = pdfData.text;
            console.log("PDF content extracted successfully, length:", proposalContent.length);

            // Split and classify chunks
            const chunks = this.chunkText(proposalContent);
            // Convert string chunks to ChunkMetadata objects
            const chunkMetadata: ChunkMetadata[] = chunks.map(content => ({ content }));
            const classifiedChunks = await this.embeddings.classifyChunks(chunkMetadata, [
                "Technical Requirements",
                "Project Management",
                "Budget",
                "Timeline",
                "Compliance",
                "Qualifications"
            ]);

            // Create embeddings for classified chunks
            const embeddings = await this.embeddings.createEmbeddings(
                classifiedChunks.map(chunk => chunk.content)
            );

            // Store chunks with metadata
            for (let i = 0; i < classifiedChunks.length; i++) {
                await this.vectorStore.addDocument({
                    id: `chunk-${i}`,
                    content: classifiedChunks[i].content,
                    embedding: embeddings[i],
                    metadata: {
                        category: classifiedChunks[i].category || undefined,
                        confidence: classifiedChunks[i].similarity
                    }
                });
            }

            // Evaluate against RFP-specific criteria
            const rfpCriteriaEvaluation = await this.evaluateRfpCriteria(classifiedChunks, rfp);

            // Evaluate against generic criteria
            const genericEvaluation = await this.evaluateGenericCriteria(classifiedChunks, rfp);

            // Generate overall assessment
            const overallAssessment = await this.generateOverallAssessment(
                rfpCriteriaEvaluation,
                genericEvaluation,
                rfp
            );

            // Calculate final score and metrics
            const { score, metrics } = this.calculateFinalScore(rfpCriteriaEvaluation, genericEvaluation);

            // Generate short evaluation
            const shortEvaluation = await this.generateShortEvaluation(
                score,
                overallAssessment
            );

            const result: EvaluationResult = {
                score,
                shortEvaluation,
                longEvaluation: '',
                details: {
                    rfpSpecificCriteria: rfpCriteriaEvaluation,
                    genericCriteria: genericEvaluation,
                    overallAssessment,
                    costEffectiveness: metrics.costEffectiveness,
                    timeline: metrics.timeline,
                    compliance: metrics.compliance,
                    projectOverview: metrics.projectOverview,
                    supplierQualifications: metrics.supplierQualifications,
                    pricing: metrics.pricing,
                    managementPlan: metrics.managementPlan,
                    productEffectiveness: metrics.productEffectiveness,
                    complianceMatrix: metrics.complianceMatrix,
                    rfpAlignment: metrics.rfpAlignment,
                    comments: {
                        strengths: genericEvaluation.technicalCapability.strengths,
                        weaknesses: genericEvaluation.technicalCapability.weaknesses,
                        recommendations: overallAssessment.recommendations
                    }
                }
            };

            // Clean up vector store
            await this.vectorStore.clear();

            return result;
        } catch (error: unknown) {
            console.error("Bid evaluation error:", error);
            await this.vectorStore.clear();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to evaluate bid: ${errorMessage}`);
        }
    }

    private async evaluateRfpCriteria(chunks: ChunkMetadata[], rfp: Rfp): Promise<EvaluationResult['details']['rfpSpecificCriteria']> {
        const prompt = `
Evaluate this bid proposal against the RFP's specific requirements and evaluation criteria.

RFP Context:
Title: ${rfp.title}
Description: ${rfp.shortDescription}

Requirements:
${JSON.stringify(rfp.requirements, null, 2)}

Evaluation Metrics:
${JSON.stringify(rfp.evaluationMetrics, null, 2)}

Proposal Content:
${chunks.map(chunk => chunk.content).join('\n\n')}

Your task is to:
1. Evaluate how well the proposal addresses each requirement
2. Score each evaluation criterion
3. For each category and criterion:
   - Provide a score (0-100)
   - List specific evidence from the proposal
   - Identify strengths and weaknesses
   - Add detailed comments justifying the score

Format response as JSON with this structure:
{
    "categories": {
        [category: string]: {
            "score": number,
            "maxScore": number,
            "comments": string[],
            "strengths": string[],
            "weaknesses": string[],
            "requirementsCoverage": {
                "met": string[],
                "partial": string[],
                "missing": string[]
            }
        }
    },
    "uncategorized": [
        {
            "criterion": string,
            "score": number,
            "maxScore": number,
            "comments": string[],
            "requirementsCoverage": {
                "met": string[],
                "partial": string[],
                "missing": string[]
            }
        }
    ]
}`;

        const response = await this.llm.generateResponse(
            prompt,
            "You are an expert bid evaluator and procurement expert working with the unicef. Provide detailed, objective evaluation based strictly on the RFP's requirements and criteria. Focus on concrete evidence from the proposal.",
            { responseFormat: "json_object" }
        );

        if (response.error) {
            throw new Error(`Failed to evaluate RFP criteria: ${response.error}`);
        }

        return JSON.parse(response.text);
    }

    private async evaluateGenericCriteria(chunks: ChunkMetadata[], rfp: Rfp): Promise<EvaluationResult['details']['genericCriteria']> {
        const prompt = `
Evaluate this bid proposal against standard procurement criteria, considering the RFP's context and domain.

RFP Context:
Title: ${rfp.title}
Description: ${rfp.shortDescription}
Budget: ${rfp.budget}
Timeline: ${rfp.timelineStartDate} to ${rfp.timelineEndDate}
Category: ${rfp.category.name}

Proposal Content:
${chunks.map(chunk => chunk.content).join('\n\n')}

Evaluate these aspects:

1. Technical Capability:
   - Solution architecture and design
   - Technology stack and tools
   - Innovation and best practices
   - Technical expertise and experience
   - Quality assurance approach

2. Project Management:
   - Project methodology
   - Team structure and roles
   - Resource allocation
   - Communication plan
   - Risk management approach
   - Timeline and milestones

3. Risk Assessment:
   - Technical risks
   - Operational risks
   - Resource risks
   - Timeline risks
   - Budget risks
   - Compliance risks

4. Compliance:
   - Industry standards
   - Technical requirements
   - Legal requirements
   - Security requirements
   - Documentation requirements

For each aspect:
- Provide a score (0-100)
- List specific strengths with evidence
- List specific weaknesses with evidence
- For risks, assess severity and provide mitigation strategies
- For compliance, list specific met and unmet requirements

Format as JSON matching the specified structure.`;

        const response = await this.llm.generateResponse(
            prompt,
            "You are an expert bid evaluator and procurement expert working with the unicef. Focus on industry standard evaluation criteria and adapt them to the RFP's specific domain and requirements.",
            { responseFormat: "json_object" }
        );

        if (response.error) {
            throw new Error(`Failed to evaluate generic criteria: ${response.error}`);
        }

        return JSON.parse(response.text);
    }

    private async generateOverallAssessment(
        rfpEvaluation: EvaluationResult['details']['rfpSpecificCriteria'],
        genericEvaluation: EvaluationResult['details']['genericCriteria'],
        rfp: Rfp
    ): Promise<EvaluationResult['details']['overallAssessment']> {
        const prompt = `
Based on the detailed evaluations, provide an overall assessment.

RFP-Specific Evaluation:
${JSON.stringify(rfpEvaluation, null, 2)}

Generic Evaluation:
${JSON.stringify(genericEvaluation, null, 2)}

RFP Context:
Title: ${rfp.title}
Budget: ${rfp.budget}
Timeline: ${rfp.timelineStartDate} to ${rfp.timelineEndDate}

Provide:
1. Key strengths
2. Key weaknesses
3. Specific recommendations for improvement

Format as JSON with these three categories.`;

        const response = await this.llm.generateResponse(
            prompt,
            "You are an expert bid evaluator and procurement expert working with the unicef. Synthesize the detailed evaluations into clear, actionable insights.",
            { responseFormat: "json_object" }
        );

        if (response.error) {
            throw new Error(`Failed to generate overall assessment: ${response.error}`);
        }

        return JSON.parse(response.text);
    }

    private calculateFinalScore(
        rfpEvaluation: EvaluationResult['details']['rfpSpecificCriteria'],
        genericEvaluation: EvaluationResult['details']['genericCriteria']
    ): { score: number; metrics: EvaluationMetrics } {
        // Calculate RFP-specific score (60% of total)
        const rfpScore = this.calculateRfpScore(rfpEvaluation) * 0.6;

        // Calculate generic criteria score (40% of total)
        const genericScore = this.calculateGenericScore(genericEvaluation) * 0.4;

        // Calculate individual metric scores
        const metrics = {
            costEffectiveness: 15,
            timeline: 10,
            compliance: 10,
            projectOverview: 10,
            supplierQualifications: 15,
            pricing: 10,
            managementPlan: 10,
            productEffectiveness: 10,
            complianceMatrix: 5,
            rfpAlignment: 5,
            comments: {
                costEffectiveness: genericEvaluation.technicalCapability.strengths,
                timeline: [],
                compliance: [],
                projectOverview: [],
                supplierQualifications: [],
                pricing: [],
                managementPlan: [],
                productEffectiveness: [],
                complianceMatrix: [],
                rfpAlignment: []
            }
        };

        // Adjust final score based on compliance and risks
        let finalScore = rfpScore + genericScore;

        // Apply penalties for critical gaps
        if (genericEvaluation.compliance.gaps.length > 0) {
            // Deduct up to 20% based on number and severity of compliance gaps
            const compliancePenalty = Math.min(20, genericEvaluation.compliance.gaps.length * 5);
            finalScore = Math.max(0, finalScore - compliancePenalty);
        }

        // Apply risk-based adjustment
        if (genericEvaluation.riskAssessment.level === 'HIGH') {
            finalScore = Math.max(0, finalScore - 15); // Deduct up to 15% for high risk
        } else if (genericEvaluation.riskAssessment.level === 'MEDIUM') {
            finalScore = Math.max(0, finalScore - 7.5); // Deduct up to 7.5% for medium risk
        }

        return {
            score: Math.round(finalScore),
            metrics
        };
    }

    private calculateRfpScore(evaluation: EvaluationResult['details']['rfpSpecificCriteria']): number {
        return Math.round(
            Object.values(evaluation.categories).reduce((total, category) => 
                total + (category.score / category.maxScore) * 100, 0) / 
            Object.keys(evaluation.categories).length
        );
    }

    private calculateGenericScore(evaluation: EvaluationResult['details']['genericCriteria']): number {
        return Math.round(
            (evaluation.technicalCapability.score + 
             evaluation.projectManagement.score + 
             evaluation.compliance.score) / 3
        );
    }

    private async generateShortEvaluation(
        score: number,
        assessment: EvaluationResult['details']['overallAssessment']
    ): Promise<string> {
        const prompt = `
Create a concise (2-3 sentences) evaluation summary:

Score: ${score}/100

Key Strengths:
${assessment.strengths.join('\n')}

Key Weaknesses:
${assessment.weaknesses.join('\n')}

Recommendations:
${assessment.recommendations.join('\n')}`;

        const response = await this.llm.generateResponse(
            prompt,
            "You are an expert bid evaluator. Provide a clear, concise summary.",
            { maxTokens: 150 }
        );

        if (response.error) {
            throw new Error(`Failed to generate short evaluation: ${response.error}`);
        }

        return response.text;
    }
}

interface EvaluationMetrics {
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
}

export const bidEvaluationService = new BidEvaluationService(); 