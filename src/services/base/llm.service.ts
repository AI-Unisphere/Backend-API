// This file is not currently used in the application
// import OpenAI from "openai";
// import fs from 'fs';
// import path from 'path';

interface GenerateResponseOptions {
    temperature?: number;
    responseFormat?: "text" | "json_object";
    maxTokens?: number;
    file?: Buffer;
    fileName?: string;
}

export abstract class BaseLLMService {
    // protected openai: OpenAI;

    constructor() {
        // This service is not currently used
    }

    protected async generateResponse(
        _prompt: string,
        _systemPrompt: string = "You are a helpful AI assistant.",
        _options: GenerateResponseOptions = {}
    ) {
        throw new Error("This method is not implemented in the base class");
    }

    // Method removed as it's not being used
    // private async uploadFile(file: Buffer, fileName: string) {
    //     throw new Error("This method is not implemented in the base class");
    // }
} 