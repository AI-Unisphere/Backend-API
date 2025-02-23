import { HfInference, FeatureExtractionOutput } from '@huggingface/inference';
import { graniteConfig } from './config';
import { chunk } from 'lodash';

export class GraniteEmbeddingService {
    private hf: HfInference;
    private readonly config = graniteConfig.embeddingModel;

    constructor() {
        if (!graniteConfig.huggingface.apiKey) {
            throw new Error('HUGGINGFACE_API_KEY is not set in environment variables');
        }
        this.hf = new HfInference(graniteConfig.huggingface.apiKey);
    }

    private normalizeText(text: string): string {
        return text
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, this.config.maxInputLength);
    }

    private ensureNumberArray(response: FeatureExtractionOutput): number[] {
        if (Array.isArray(response)) {
            if (response.length === 0) {
                throw new Error('Empty embedding response');
            }
            if (Array.isArray(response[0])) {
                // If it's a 2D array, return the first row
                return response[0] as number[];
            }
            return response as number[];
        }
        throw new Error('Unexpected embedding format');
    }

    async createEmbedding(text: string): Promise<number[]> {
        try {
            const normalizedText = this.normalizeText(text);
            const response = await this.hf.featureExtraction({
                model: this.config.name,
                inputs: normalizedText
            });

            return this.ensureNumberArray(response);
        } catch (error) {
            console.error('Error creating embedding:', error);
            throw new Error('Failed to create embedding');
        }
    }

    async createEmbeddings(texts: string[]): Promise<number[][]> {
        try {
            // Process texts in batches to avoid rate limits
            const batches = chunk(texts, this.config.batchSize);
            const embeddings: number[][] = [];

            for (const batch of batches) {
                const normalizedBatch = batch.map(text => this.normalizeText(text));
                const responses = await Promise.all(
                    normalizedBatch.map(text => 
                        this.hf.featureExtraction({
                            model: this.config.name,
                            inputs: text
                        })
                    )
                );
                embeddings.push(...responses.map(response => this.ensureNumberArray(response)));
            }

            return embeddings;
        } catch (error) {
            console.error('Error creating embeddings batch:', error);
            throw new Error('Failed to create embeddings batch');
        }
    }

    // Method to calculate cosine similarity between two embeddings
    calculateSimilarity(embedding1: number[], embedding2: number[]): number {
        if (embedding1.length !== embedding2.length) {
            throw new Error('Embeddings must have the same dimensions');
        }

        const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
        const norm1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
        const norm2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));

        return dotProduct / (norm1 * norm2);
    }
} 