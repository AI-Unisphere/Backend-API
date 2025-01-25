import { BaseLLMService } from "./base/llm.service";

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

export class LLMService extends BaseLLMService {
    async generateRfpDescription(input: RfpInput): Promise<string> {
        const requirements = [
            ...(input.technicalRequirements || []),
            ...(input.managementRequirements || [])
        ];

        const evaluationCriteria = input.evaluationCriteria?.metrics
            .map(m => `${m.name} (${m.weightage}%)`)
            .join(", ");

        const prompt = `
As an AI assistant specializing in government procurement with a focus on the telecommunications industry and coverage in education and health in Africa, create a detailed RFP (Request for Proposal) description based on the following information:

Title: ${input.title}
Short Description: ${input.shortDescription}
Budget: $${input.budget.toLocaleString()}

Technical and Management Requirements:
${requirements.map(r => `- ${r}`).join('\n')}

Pricing Details:
${input.pricingDetails || "Not specified"}

Evaluation Criteria:
${evaluationCriteria || "Not specified"}

Special Instructions:
${input.specialInstructions || "None"}

Please generate a comprehensive, well-structured RFP description that:
1. Clearly outlines the project scope and objectives
2. Incorporates all technical and management requirements
3. Explains the evaluation criteria and their weightage
4. Includes budget considerations and pricing requirements
5. Maintains a professional and formal tone
6. Uses clear and unambiguous language`;

        return this.generateResponse(
            prompt,
            "You are an expert in government procurement and RFP writing. Your task is to generate detailed, professional RFP descriptions that are clear, comprehensive, and follow best practices in government procurement.",
            {
                temperature: 0.7,
                maxTokens: 2000
            }
        );
    }
}

export const llmService = new LLMService(); 