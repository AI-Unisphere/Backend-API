import { Rfp } from "../models/Rfp";
import { BaseLLMService } from "./base/llm.service";

interface BidAnalysisResult {
    suggestions: {
        budget?: string[];
        technical?: string[];
        timeline?: string[];
        team?: string[];
        documentation?: string[];
    };
    isComplete: boolean;
    score: number;  // Overall proposal score out of 100
}

export class BidAnalysisService extends BaseLLMService {
    async analyzeBidProposal(proposalFile: Buffer, fileName: string, rfp: Rfp): Promise<BidAnalysisResult> {
        try {
            const prompt = `
As an AI expert in government procurement, analyze this bid proposal against the RFP requirements and provide actionable suggestions for improvement:

RFP Details:
- Title: ${rfp.title}
- Short Description: ${rfp.shortDescription}
- Budget: $${rfp.budget}
- Timeline: ${rfp.timelineStartDate} to ${rfp.timelineEndDate}
- Long Description: ${rfp.longDescription}

Please analyze the proposal and provide specific suggestions in these areas:
1. Budget - Are costs reasonable and well-justified?
2. Technical Approach - Does it meet all requirements?
3. Timeline - Is it realistic and aligned with RFP?
4. Team - Are all necessary skills covered?
5. Documentation - Is anything missing?

Also provide:
- Whether the proposal is complete
- An overall score (0-100) based on how well it meets RFP requirements

Format your response as a JSON object with the following structure:
{
    "suggestions": {
        "budget": ["string"],        // Budget-related suggestions (omit if none)
        "technical": ["string"],     // Technical approach suggestions (omit if none)
        "timeline": ["string"],      // Timeline-related suggestions (omit if none)
        "team": ["string"],          // Team composition suggestions (omit if none)
        "documentation": ["string"]  // Missing or incomplete documentation (omit if none)
    },
    "isComplete": boolean,
    "score": number                 // 0-100 score
}`;

            const result = await this.generateResponse(
                prompt,
                "You are an expert in analyzing government procurement proposals. Focus on providing clear, actionable suggestions for improvement.",
                {
                    temperature: 0.3,
                    responseFormat: "json_object",
                    file: proposalFile,
                    fileName: fileName
                }
            );

            return result as BidAnalysisResult;
        } catch (error) {
            console.error("Bid analysis error:", error);
            throw new Error("Failed to analyze bid proposal");
        }
    }
}

export const bidAnalysisService = new BidAnalysisService(); 