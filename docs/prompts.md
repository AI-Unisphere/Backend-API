# UniSphere AI Prompts Documentation (v1)

This document catalogs all the AI prompts used in the UniSphere system for transparency and version tracking.

## RFP Generation Prompts

### RFP Long Description Generation

**Service**: `rfpGeneration.service.ts`
**Purpose**: Generates comprehensive RFP descriptions from input parameters

``` markdown
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
7. Kindly avoid putting any form of placeholder text in the response.
```

## Bid Evaluation Prompts

### Initial Bid Analysis

**Service**: `bidAnalysis.service.ts`
**Purpose**: Provides initial analysis and suggestions for bid proposals

``` markdown
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

# RFP Information Extraction Prompt

## Purpose
This prompt is designed to extract structured information from RFP documents for auto-filling the RFP creation form.

## Prompt Template
```
You are an expert procurement analyst. Analyze the provided document and extract relevant information for creating an RFP (Request for Proposal).
Extract ONLY the information that is explicitly mentioned or can be directly inferred from the document.
If certain information is not present or cannot be confidently inferred, DO NOT include it in the response.

Please extract and format the information in the following JSON structure:
{
    "title": "The main title or subject of the RFP",
    "shortDescription": "A brief (1-2 sentences) description of the project",
    "timeline": {
        "startDate": "Project start date in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)",
        "endDate": "Project end date in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)"
    },
    "budget": "The total budget as a number (no currency symbol)",
    "submissionDeadline": "Deadline for bid submissions in ISO 8601 format",
    "technicalRequirements": [
        "List of technical requirements"
    ],
    "managementRequirements": [
        "List of management/operational requirements"
    ],
    "pricingDetails": "Specific pricing requirements or breakdown structure",
    "evaluationCriteria": {
        "metrics": [
            {
                "name": "Criterion name",
                "weightage": "Percentage as a number"
            }
        ]
    },
    "specialInstructions": "Any special instructions or additional requirements"
}

Important Notes:
1. Only include fields where information is explicitly present in the document
2. For missing information, omit the field entirely
3. Convert all dates to ISO 8601 format
4. Convert all budgets to numbers without currency symbols
5. Ensure evaluation criteria weightages sum to 100 if provided

Document to analyze:
${documentContent}
```

## System Message
```
You are an expert procurement analyst specialized in RFP information extraction. Be precise and only extract information that is explicitly present or can be directly inferred from the document.
```

## Configuration
- Temperature: 0.1 (for high precision)
- Response Format: JSON object
- Purpose: Extract structured information from RFP documents for form auto-filling

## Expected Output Format
```json
{
    "title": "Smart Health Software Connectivity Project",
    "shortDescription": "Deploy high-speed Health software connectivity to 40 rural tech hubs...",
    "timeline": {
        "startDate": "2025-04-01T00:00:00Z",
        "endDate": "2025-10-31T23:59:59Z"
    },
    "budget": 250000,
    "submissionDeadline": "2025-01-28T14:27:59Z",
    "technicalRequirements": [
        "Minimum 100 Mbps dedicated internet connection per hub",
        "99.9% uptime guarantee"
    ],
    "managementRequirements": [
        "Weekly progress reports",
        "Monthly reviews"
    ],
    "pricingDetails": "Provide a detailed cost breakdown including: Equipment costs, Installation charges...",
    "evaluationCriteria": {
        "metrics": [
            {
                "name": "Cost-effectiveness",
                "weightage": 30
            },
            {
                "name": "Technical Capability",
                "weightage": 70
            }
        ]
    },
    "specialInstructions": "Bidders must include: 1. Evidence of similar projects..."
}
```

## Notes
- The prompt is designed to be strict about only extracting information that is explicitly present
- Fields will be omitted if information is not found in the document
- All dates are standardized to ISO 8601 format
- Budget values are converted to numbers without currency symbols
- Evaluation criteria weightages are validated to sum to 100% 

## RAG-Enhanced Bid Analysis Prompt

**Service**: `bidAnalysis.service.ts`
**Purpose**: Analyzes bid proposals using RAG for enhanced context

```markdown
As an expert in analyzing government procurement proposals, analyze this bid proposal using the provided context and requirements. Consider the following information:

Context from RFP:
${relevantContext}

Bid Details:
${bidContent}

Please provide a detailed analysis in JSON format that includes:
{
    "technicalCompliance": {
        "score": number (0-100),
        "findings": string[],
        "recommendations": string[]
    },
    "budgetAnalysis": {
        "score": number (0-100),
        "findings": string[],
        "recommendations": string[]
    },
    "timelineAssessment": {
        "score": number (0-100),
        "findings": string[],
        "recommendations": string[]
    },
    "overallScore": number (0-100),
    "summary": string,
    "keyStrengths": string[],
    "keyWeaknesses": string[],
    "improvementAreas": string[]
}

Focus on:
1. Alignment with RFP requirements
2. Technical feasibility
3. Cost effectiveness
4. Timeline realism
5. Risk assessment
```

## RAG-Enhanced Bid Evaluation Prompt

**Service**: `bidEvaluation.service.ts`
**Purpose**: Performs comprehensive bid evaluation with RAG-enhanced context analysis

```markdown
As an expert procurement bid evaluator, evaluate this proposal using the provided context and requirements:

RFP Context:
${relevantContext}

Bid Content:
${bidContent}

Historical Context (if available):
${historicalContext}

Provide a detailed evaluation in JSON format:
{
    "evaluationCriteria": [
        {
            "criterion": string,
            "score": number (0-100),
            "weight": number,
            "findings": string[],
            "justification": string
        }
    ],
    "technicalEvaluation": {
        "score": number (0-100),
        "strengths": string[],
        "weaknesses": string[],
        "risks": string[]
    },
    "complianceEvaluation": {
        "score": number (0-100),
        "compliantAreas": string[],
        "nonCompliantAreas": string[],
        "recommendations": string[]
    },
    "overallScore": number (0-100),
    "evaluationSummary": string,
    "recommendedAction": "ACCEPT" | "REJECT" | "REVISE",
    "justification": string
}

Consider:
1. Technical merit and innovation
2. Past performance (if available)
3. Risk assessment
4. Value for money
5. Compliance with requirements
```

## Configuration Notes (Updated)

1. **Temperature Settings**:
   - RFP Generation: 0.7 (moderate creativity)
   - Bid Analysis: 0.2 (high precision with RAG)
   - Bid Evaluation: 0.2 (high precision with RAG)

2. **Response Formats**:
   - RFP Generation: Text
   - Bid Analysis: JSON
   - Bid Evaluation: JSON
   - Information Extraction: JSON

3. **Model**: GPT-4 Turbo

4. **RAG Configuration**:
   - Chunk size: 1000 tokens
   - Overlap: 200 tokens
   - Top k: 5 most relevant chunks
   - Embedding model: text-embedding-3-small

## Version History

### v1.1.0
- Added RAG-enhanced bid analysis prompt
- Added RAG-enhanced bid evaluation prompt
- Updated temperature settings for better precision
- Added RAG configuration details
- Updated model to GPT-4 Turbo

### v1.0.0
- Initial implementation of RFP generation prompts
- Initial implementation of bid analysis prompts
- Initial implementation of comprehensive bid evaluation prompts
- Base system instructions for each service

# RFP Information Extraction Prompt

## Purpose
This prompt is designed to extract structured information from RFP documents for auto-filling the RFP creation form.

## Prompt Template
```
You are an expert procurement analyst. Analyze the provided document and extract relevant information for creating an RFP (Request for Proposal).
Extract ONLY the information that is explicitly mentioned or can be directly inferred from the document.
If certain information is not present or cannot be confidently inferred, DO NOT include it in the response.

Please extract and format the information in the following JSON structure:
{
    "title": "The main title or subject of the RFP",
    "shortDescription": "A brief (1-2 sentences) description of the project",
    "timeline": {
        "startDate": "Project start date in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)",
        "endDate": "Project end date in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)"
    },
    "budget": "The total budget as a number (no currency symbol)",
    "submissionDeadline": "Deadline for bid submissions in ISO 8601 format",
    "technicalRequirements": [
        "List of technical requirements"
    ],
    "managementRequirements": [
        "List of management/operational requirements"
    ],
    "pricingDetails": "Specific pricing requirements or breakdown structure",
    "evaluationCriteria": {
        "metrics": [
            {
                "name": "Criterion name",
                "weightage": "Percentage as a number"
            }
        ]
    },
    "specialInstructions": "Any special instructions or additional requirements"
}

Important Notes:
1. Only include fields where information is explicitly present in the document
2. For missing information, omit the field entirely
3. Convert all dates to ISO 8601 format
4. Convert all budgets to numbers without currency symbols
5. Ensure evaluation criteria weightages sum to 100 if provided

Document to analyze:
${documentContent}
```

## System Message
```
You are an expert procurement analyst specialized in RFP information extraction. Be precise and only extract information that is explicitly present or can be directly inferred from the document.
```

## Configuration
- Temperature: 0.1 (for high precision)
- Response Format: JSON object
- Purpose: Extract structured information from RFP documents for form auto-filling

## Expected Output Format
```json
{
    "title": "Smart Health Software Connectivity Project",
    "shortDescription": "Deploy high-speed Health software connectivity to 40 rural tech hubs...",
    "timeline": {
        "startDate": "2025-04-01T00:00:00Z",
        "endDate": "2025-10-31T23:59:59Z"
    },
    "budget": 250000,
    "submissionDeadline": "2025-01-28T14:27:59Z",
    "technicalRequirements": [
        "Minimum 100 Mbps dedicated internet connection per hub",
        "99.9% uptime guarantee"
    ],
    "managementRequirements": [
        "Weekly progress reports",
        "Monthly reviews"
    ],
    "pricingDetails": "Provide a detailed cost breakdown including: Equipment costs, Installation charges...",
    "evaluationCriteria": {
        "metrics": [
            {
                "name": "Cost-effectiveness",
                "weightage": 30
            },
            {
                "name": "Technical Capability",
                "weightage": 70
            }
        ]
    },
    "specialInstructions": "Bidders must include: 1. Evidence of similar projects..."
}
```

## Notes
- The prompt is designed to be strict about only extracting information that is explicitly present
- Fields will be omitted if information is not found in the document
- All dates are standardized to ISO 8601 format
- Budget values are converted to numbers without currency symbols
- Evaluation criteria weightages are validated to sum to 100% 