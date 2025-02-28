import { HfInference } from '@huggingface/inference';
import { graniteConfig } from './config';
import { GenerationOptions, ModelResponse } from './config';
import { encode, decode } from 'gpt-tokenizer';

export class GraniteLLMService {
    private hf: HfInference;
    private readonly config = graniteConfig.llmModel;
    private readonly MAX_INPUT_TOKENS = 3500; // Reserve space for system prompt and output tokens
    private readonly MAX_RETRIES = 3;
    private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

    constructor() {
        if (!graniteConfig.huggingface.apiKey) {
            throw new Error('HUGGINGFACE_API_KEY is not set in environment variables');
        }
        this.hf = new HfInference(graniteConfig.huggingface.apiKey);
    }

    private formatPrompt(prompt: string, systemPrompt: string): string {
        return `<|system|>${systemPrompt}\n<|user|>${prompt}\n<|assistant|>`;
    }

    // New method to truncate text to fit within token limits
    private truncateToTokenLimit(text: string): string {
        const tokens = encode(text);
        
        if (tokens.length <= this.MAX_INPUT_TOKENS) {
            return text;
        }
        
        console.warn(`Input too long (${tokens.length} tokens). Truncating to ${this.MAX_INPUT_TOKENS} tokens.`);
        const truncatedTokens = tokens.slice(0, this.MAX_INPUT_TOKENS);
        return decode(truncatedTokens);
    }

    // New method to extract and repair JSON from text
    private extractAndRepairJson(text: string): string {
        // Log the raw response for debugging
        console.log("Raw LLM response:", text.substring(0, 100) + "...");
        
        // Try to find JSON content between curly braces
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON object found in response");
        }
        
        let jsonStr = jsonMatch[0];
        
        // Basic JSON repairs
        jsonStr = jsonStr
            // Fix trailing commas in objects
            .replace(/,\s*}/g, '}')
            // Fix trailing commas in arrays
            .replace(/,\s*]/g, ']')
            // Ensure property names are double-quoted
            .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
            // Ensure string values are double-quoted
            .replace(/:\s*'([^']*)'/g, ': "$1"');
        
        try {
            // Validate the repaired JSON
            JSON.parse(jsonStr);
            return jsonStr;
        } catch (error) {
            console.error("JSON repair failed:", error);
            throw new Error("Failed to repair JSON response");
        }
    }

    // Helper method to sleep
    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async generateCompletionWithRetry(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions = {},
        retryCount = 0
    ): Promise<string> {
        try {
            // Truncate prompt if needed
            const truncatedPrompt = this.truncateToTokenLimit(prompt);
            const formattedPrompt = this.formatPrompt(truncatedPrompt, systemPrompt);
            
            return await this.hf.textGeneration({
                model: this.config.name,
                inputs: formattedPrompt,
                parameters: {
                    max_new_tokens: options.maxTokens || this.config.maxOutputTokens,
                    temperature: options.temperature || this.config.temperature,
                    top_p: this.config.topP,
                    return_full_text: false
                }
            }).then(response => response.generated_text);
        } catch (error) {
            if (retryCount < this.MAX_RETRIES) {
                // Calculate exponential backoff delay
                const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
                console.warn(`API call failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`, error);
                
                // Wait before retrying
                await this.sleep(delay);
                
                // Retry with incremented counter
                return this.generateCompletionWithRetry(prompt, systemPrompt, options, retryCount + 1);
            }
            
            // If we've exhausted all retries, throw the error
            console.error('Error generating completion after all retries:', error);
            throw new Error('Failed to generate completion after multiple attempts');
        }
    }

    private async generateCompletion(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions = {}
    ): Promise<string> {
        return this.generateCompletionWithRetry(prompt, systemPrompt, options);
    }

    async generateResponse(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions = {}
    ): Promise<ModelResponse> {
        try {
            const text = await this.generateCompletion(prompt, systemPrompt, options);

            // If JSON response is requested, validate and repair the response
            if (options.responseFormat === 'json_object') {
                try {
                    // Try to extract and repair JSON
                    const jsonText = this.extractAndRepairJson(text);
                    return { text: jsonText };
                } catch (error) {
                    console.error('Failed to parse response as JSON:', error);
                    
                    // Return a fallback empty JSON structure
                    if (prompt.includes("requirements")) {
                        return { 
                            text: JSON.stringify({
                                categories: {},
                                uncategorized: []
                            })
                        };
                    } else if (prompt.includes("evaluation metrics")) {
                        return { 
                            text: JSON.stringify({
                                categories: {},
                                uncategorized: []
                            })
                        };
                    } else if (prompt.includes("basic RFP information")) {
                        return { 
                            text: JSON.stringify({
                                title: "Unknown Title",
                                shortDescription: "No description available",
                                timeline: {
                                    startDate: null,
                                    endDate: null
                                },
                                budget: null,
                                submissionDeadline: null
                            })
                        };
                    }
                    
                    throw new Error('Generated response is not valid JSON');
                }
            }

            return { text };
        } catch (error) {
            console.error('Error in generate response:', error);
            return {
                text: '',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}