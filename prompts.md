# UniSphere AI Prompts Documentation (v1)

This document catalogs all the AI prompts used in the UniSphere system for transparency and version tracking.

## RFP Generation Prompts

### RFP Long Description Generation
**Service**: `rfpGeneration.service.ts`
**Purpose**: Generates comprehensive RFP descriptions from input parameters
```
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
6. Uses clear and unambiguous language
```

## Bid Evaluation Prompts

### Initial Bid Analysis
**Service**: `bidAnalysis.service.ts`
**Purpose**: Provides initial analysis and suggestions for bid proposals
```
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
```

### Comprehensive Bid Evaluation
**Service**: `bidEvaluation.service.ts`
**Purpose**: Performs detailed evaluation of submitted bids
```
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
```

## System Instructions

### RFP Generation System Prompt
```
You are an expert in government procurement and RFP writing. Your task is to generate detailed, professional RFP descriptions that are clear, comprehensive, and follow best practices in government procurement.
```

### Bid Evaluation System Prompt
```
You are an expert procurement bid evaluator with extensive experience in government contracts. Focus on providing detailed, objective evaluations with specific evidence from the proposal.
```

## Configuration Notes

1. **Temperature Settings**:
   - RFP Generation: 0.7 (moderate creativity)
   - Bid Analysis: 0.3 (more conservative)
   - Bid Evaluation: 0.3 (more conservative)

2. **Response Formats**:
   - RFP Generation: Text
   - Bid Analysis: JSON
   - Bid Evaluation: JSON

3. **Model**: GPT-4

## Version History

### v1.0.0
- Initial implementation of RFP generation prompts
- Initial implementation of bid analysis prompts
- Initial implementation of comprehensive bid evaluation prompts
- Base system instructions for each service 