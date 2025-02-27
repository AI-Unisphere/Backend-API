import { config } from 'dotenv';

config();

export interface GraniteConfig {
    embeddingModel: {
        name: string;
        maxInputLength: number;
        outputDimensions: number;
        batchSize: number;
    };
    llmModel: {
        name: string;
        maxInputTokens: number;
        maxOutputTokens: number;
        temperature: number;
        topP: number;
    };
    huggingface: {
        apiKey: string;
        apiBaseUrl: string;
    };
}

export const graniteConfig: GraniteConfig = {
    embeddingModel: {
        name: 'ibm-granite/granite-embedding-30m-english',
        maxInputLength: 512,  // Maximum sequence length
        outputDimensions: 110, // Updated to match actual dimensions
        batchSize: 32  // Number of texts to process in parallel
    },
    llmModel: {
        name: 'ibm-granite/granite-3.1-2b-instruct',
        maxInputTokens: 2048,  // Updated for 3.1-2B model
        maxOutputTokens: 512,  // Updated for 3.1-2B model
        temperature: 0.3,  // Lower temperature for more focused outputs
        topP: 0.9
    },
    huggingface: {
        apiKey: process.env.HUGGINGFACE_API_KEY || '',
        apiBaseUrl: 'https://api-inference.huggingface.co/models'
    }
};

export interface ModelResponse {
    text: string;
    error?: string;
}

export interface ModelParameters {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    responseFormat?: string;
}

export interface GenerationOptions {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: string;
} 