import { HfInference } from '@huggingface/inference';
import { graniteConfig } from './config';
import { GenerationOptions, ModelResponse } from './config';
import { encode, decode } from 'gpt-tokenizer';

export class GraniteLLMService {
    private hf: HfInference;
    private readonly config = graniteConfig.llmModel;
    private readonly MAX_INPUT_TOKENS = 3500; // Reserve space for system prompt and output tokens

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

    private async generateCompletion(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions = {}
    ): Promise<string> {
        // Truncate prompt if needed
        const truncatedPrompt = this.truncateToTokenLimit(prompt);
        const formattedPrompt = this.formatPrompt(truncatedPrompt, systemPrompt);
        
        try {
            const response = await this.hf.textGeneration({
                model: this.config.name,
                inputs: formattedPrompt,
                parameters: {
                    max_new_tokens: options.maxTokens || this.config.maxOutputTokens,
                    temperature: options.temperature || this.config.temperature,
                    top_p: this.config.topP,
                    return_full_text: false
                }
            });

            return response.generated_text;
        } catch (error) {
            console.error('Error generating completion:', error);
            throw new Error('Failed to generate completion');
        }
    }

    async generateResponse(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions = {}
    ): Promise<ModelResponse> {
        try {
            const text = await this.generateCompletion(prompt, systemPrompt, options);

            // If JSON response is requested, validate the response
            if (options.responseFormat === 'json_object') {
                try {
                    // Try to parse as JSON
                    const jsonResponse = JSON.parse(text);
                    return { text: JSON.stringify(jsonResponse) };
                } catch (error) {
                    console.error('Failed to parse response as JSON:', error);
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