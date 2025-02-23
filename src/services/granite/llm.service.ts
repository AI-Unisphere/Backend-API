import { HfInference } from '@huggingface/inference';
import { graniteConfig } from './config';
import { GenerationOptions, ModelResponse } from './config';

export class GraniteLLMService {
    private hf: HfInference;
    private readonly config = graniteConfig.llmModel;

    constructor() {
        if (!graniteConfig.huggingface.apiKey) {
            throw new Error('HUGGINGFACE_API_KEY is not set in environment variables');
        }
        this.hf = new HfInference(graniteConfig.huggingface.apiKey);
    }

    private formatPrompt(prompt: string, systemPrompt: string): string {
        return `<|system|>${systemPrompt}\n<|user|>${prompt}\n<|assistant|>`;
    }

    private async generateCompletion(
        prompt: string,
        systemPrompt: string,
        options: GenerationOptions = {}
    ): Promise<string> {
        const formattedPrompt = this.formatPrompt(prompt, systemPrompt);
        
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