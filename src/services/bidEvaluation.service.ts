import { BaseLLMService } from "./base/llm.service";
import { Rfp } from "../models/Rfp";
import { Bid } from "../models/Bid";
import fs from 'fs';
import path from 'path';

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

export class BidEvaluationService extends BaseLLMService {
    async evaluateBid(bid: Bid, rfp: Rfp): Promise<EvaluationResult> {
        try {
            const filePath = path.join(process.cwd(), 'uploads/proposals', bid.proposalDocument);
            const proposalFile = fs.readFileSync(filePath);

            const prompt = `
As an expert AI evaluator for government procurement bids, conduct a comprehensive evaluation of this bid proposal against the RFP requirements.

RFP Details:
Title: ${rfp.title}
Description: ${rfp.shortDescription}
Long Description: ${rfp.longDescription}
Budget: $${rfp.budget}
Timeline: ${rfp.timelineStartDate} to ${rfp.timelineEndDate}

Evaluate the proposal on these criteria (score each from 0-100):

1. Cost-effectiveness (15%):
   - Value for money
   - Budget alignment
   - Cost justification

2. Timeline Compliance (10%):
   - Project schedule
   - Milestone alignment
   - Delivery feasibility

3. RFP Compliance (10%):
   - Requirements coverage
   - Documentation completeness
   - Specification adherence

4. Project Overview (10%):
   - Clarity of approach
   - Understanding of requirements
   - Solution completeness

5. Supplier Qualifications (15%):
   - Experience
   - Certifications
   - References
   - Past performance

6. Pricing Structure (10%):
   - Cost breakdown
   - Transparency
   - Value proposition

7. Management Plan (10%):
   - Team structure
   - Resource allocation
   - Implementation strategy

8. Product/Service Effectiveness (10%):
   - Solution quality
   - Innovation
   - Technical merit

9. Compliance Matrix (5%):
   - Technical compliance
   - Administrative compliance
   - Legal requirements

10. RFP Alignment (5%):
    - Strategic fit
    - Goal alignment
    - Success metrics

Provide:
1. Individual scores for each criterion (0-100)
2. Specific comments/feedback for each criterion
3. Overall weighted score (0-100)
4. Short evaluation summary (max 100 words)
5. Detailed evaluation explanation (max 500 words)

Format your response as a JSON object with this structure:
{
    "score": number,
    "shortEvaluation": "string",
    "longEvaluation": "string",
    "details": {
        "costEffectiveness": number,
        "timeline": number,
        "compliance": number,
        "projectOverview": number,
        "supplierQualifications": number,
        "pricing": number,
        "managementPlan": number,
        "productEffectiveness": number,
        "complianceMatrix": number,
        "rfpAlignment": number,
        "comments": {
            "costEffectiveness": ["string"],
            "timeline": ["string"],
            "compliance": ["string"],
            "projectOverview": ["string"],
            "supplierQualifications": ["string"],
            "pricing": ["string"],
            "managementPlan": ["string"],
            "productEffectiveness": ["string"],
            "complianceMatrix": ["string"],
            "rfpAlignment": ["string"]
        }
    }
}`;

            const result = await this.generateResponse(
                prompt,
                "You are an expert procurement bid evaluator with extensive experience in government contracts. Focus on providing detailed, objective evaluations with specific evidence from the proposal.",
                {
                    temperature: 0.3,
                    responseFormat: "json_object",
                    file: proposalFile,
                    fileName: bid.proposalDocument
                }
            );

            return result as EvaluationResult;
        } catch (error) {
            console.error("Bid evaluation error:", error);
            throw new Error("Failed to evaluate bid proposal");
        }
    }
}

export const bidEvaluationService = new BidEvaluationService(); 