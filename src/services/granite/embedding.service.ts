import { HfInference, FeatureExtractionOutput } from '@huggingface/inference';
import { graniteConfig } from './config';
import { chunk } from 'lodash';

export interface ChunkMetadata {
    content: string;
    category?: string;
    confidence?: number;
}

interface ClassificationResponse {
    sequence: string;
    labels: string[];
    scores: number[];
}

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
            let embedding: number[];
            if (Array.isArray(response[0])) {
                // If it's a 2D array, return the first row
                embedding = response[0] as number[];
            } else {
                embedding = response as number[];
            }
            
            // Validate dimensions
            if (embedding.length !== this.config.outputDimensions) {
                throw new Error(`Invalid embedding dimensions: expected ${this.config.outputDimensions}, got ${embedding.length}`);
            }
            
            return embedding;
        }
        throw new Error('Unexpected embedding format');
    }

    async createEmbedding(text: string): Promise<number[]> {
        try {
            const normalizedText = this.normalizeText(text);
            console.log(`Creating embedding for text (length: ${normalizedText.length})`);
            
            const response = await this.hf.featureExtraction({
                model: this.config.name,
                inputs: normalizedText
            });
            
            console.log('Raw embedding response type:', Array.isArray(response) ? 'array' : typeof response);
            if (Array.isArray(response)) {
                console.log('Response array length:', response.length);
                if (response.length > 0) {
                    console.log('First element type:', Array.isArray(response[0]) ? 'array' : typeof response[0]);
                }
            }
            
            const embedding = this.ensureNumberArray(response);
            console.log(`Successfully created embedding with dimensions: ${embedding.length}`);
            return embedding;
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

    async classifyChunks(chunks: string[]): Promise<ChunkMetadata[]> {
        const categories = [
            "Requirements",
            "Technical Specifications",
            "Pricing Details",
            "Technical Requirements",
            "Management Requirements",
            "Evaluation Criteria",
            "Budget Information",
            "Timeline",
            "Submission Guidelines",
            "Legal Requirements",
            "Background Information"
        ];

        try {
            const results: ChunkMetadata[] = [];

            for (const content of chunks) {
                // Using feature extraction to create embeddings for both content and categories
                const contentEmbedding = await this.createEmbedding(content);
                const categoryEmbeddings = await Promise.all(
                    categories.map(category => this.createEmbedding(category))
                );

                // Calculate similarities
                const similarities = categoryEmbeddings.map(categoryEmbedding => 
                    this.calculateSimilarity(contentEmbedding, categoryEmbedding)
                );

                // Find the best matching category
                const maxIndex = similarities.indexOf(Math.max(...similarities));
                const topCategory = categories[maxIndex];
                const topScore = similarities[maxIndex];

                results.push({
                    content,
                    category: topScore > 0.5 ? topCategory : undefined,
                    confidence: topScore
                });
            }

            return results;
        } catch (error) {
            console.error('Error classifying chunks:', error);
            throw new Error('Failed to classify document chunks');
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