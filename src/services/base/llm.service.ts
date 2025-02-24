import OpenAI from "openai";
import fs from 'fs';
import path from 'path';

interface GenerateResponseOptions {
    temperature?: number;
    responseFormat?: "text" | "json_object";
    maxTokens?: number;
    file?: Buffer;
    fileName?: string;
}

export abstract class BaseLLMService {
    protected openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    protected async generateResponse(
        prompt: string,
        systemPrompt: string = "You are a helpful AI assistant.",
        options: GenerateResponseOptions = {}
    ) {
        const { 
            temperature = 0.7, 
            responseFormat, 
            maxTokens = 2000, 
            file, 
            fileName 
        } = options;

        try {
            const messages = [
                {
                    role: "system" as const,
                    content: systemPrompt
                },
                {
                    role: "user" as const,
                    content: responseFormat === "json_object" 
                        ? `${prompt}\n\nRespond with valid JSON only, no additional text. Ensure the response matches the exact format specified.`
                        : prompt
                }
            ];

            // Handle file upload if provided
            if (file && fileName) {
                const fileData = await this.uploadFile(file, fileName);
                messages.push({
                    role: "user" as const,
                    content: `Analyzing document: ${fileData.id}`
                });
            }

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages,
                temperature,
                max_tokens: maxTokens,
                response_format: responseFormat === "json_object" ? { type: "json_object" } : undefined
            });

            const content = completion.choices[0].message.content;
            if (!content) {
                throw new Error("No content in response");
            }

            if (responseFormat === "json_object") {
                try {
                    // Log the raw response for debugging
                    console.log("Raw LLM response:", content);
                    
                    // Try to clean the response before parsing
                    const cleanedContent = content.trim().replace(/^```json\s*|\s*```$/g, '');
                    const parsedContent = JSON.parse(cleanedContent);
                    
                    // Validate the parsed content has the expected structure
                    if (typeof parsedContent !== 'object' || parsedContent === null) {
                        throw new Error("Response is not a valid JSON object");
                    }
                    
                    return parsedContent;
                } catch (e: unknown) {
                    console.error("JSON parsing error:", e);
                    console.error("Failed to parse content:", content);
                    throw new Error(`Failed to parse JSON response from LLM: ${e instanceof Error ? e.message : 'Unknown parsing error'}`);
                }
            }

            return content;
        } catch (error: any) {
            console.error("OpenAI API error:", error);
            if (error?.response?.data) {
                console.error("API error details:", error.response.data);
            }
            throw new Error(`Failed to generate response from LLM: ${error?.message || 'Unknown error'}`);
        }
    }

    private async uploadFile(file: Buffer, fileName: string) {
        try {
            // Create a temporary file
            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const tempFilePath = path.join(tempDir, fileName);
            
            // Write the buffer to a temporary file
            fs.writeFileSync(tempFilePath, file);

            // Upload the file to OpenAI
            const response = await this.openai.files.create({
                file: fs.createReadStream(tempFilePath),
                purpose: "assistants"
            });

            // Clean up the temporary file
            fs.unlinkSync(tempFilePath);

            return response;
        } catch (error) {
            console.error("File upload error:", error);
            throw new Error("Failed to upload file to OpenAI");
        }
    }
} 