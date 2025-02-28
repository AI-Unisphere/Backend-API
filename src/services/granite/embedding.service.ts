import { HfInference, FeatureExtractionOutput } from '@huggingface/inference';
import { graniteConfig } from './config';
import { chunk } from 'lodash';

// Define ChunkMetadata interface locally to avoid circular dependency
export interface ChunkMetadata {
    content: string;
    category?: string | null;
    similarity?: number;
}

export class GraniteEmbeddingService {
    private hf: HfInference;
    private readonly config = graniteConfig.embeddingModel;
    private readonly MAX_RETRIES = 3;
    private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

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

    // Helper method to sleep
    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Helper to ensure we have a number array from the API response
    private ensureNumberArray(output: FeatureExtractionOutput): number[] {
        if (Array.isArray(output)) {
            if (output.length > 0) {
                if (Array.isArray(output[0])) {
                    // Handle case where output is number[][]
                    return output[0] as number[];
                }
                // Handle case where output is number[]
                return output as number[];
            }
            return [];
        } else if (typeof output === 'number') {
            // Handle case where output is a single number
            return [output];
        }
        
        console.error('Unexpected embedding format:', output);
        return Array(this.config.outputDimensions).fill(0);
    }

    // Normalize embedding dimensions to match expected output
    private normalizeDimensions(embedding: number[], targetDimension: number): number[] {
        if (embedding.length === targetDimension) {
            return embedding;
        }
        
        console.log(`Normalizing embedding from ${embedding.length} to ${targetDimension} dimensions`);
        
        if (embedding.length > targetDimension) {
            // Truncate if longer than expected
            return embedding.slice(0, targetDimension);
        } else {
            // Pad with zeros if shorter than expected
            return [...embedding, ...Array(targetDimension - embedding.length).fill(0)];
        }
    }

    private async createEmbeddingWithRetry(text: string, retryCount = 0): Promise<number[]> {
        try {
            // Ensure text is not empty
            if (!text || text.trim().length === 0) {
                console.warn('Empty text provided for embedding, returning zero vector');
                return Array(this.config.outputDimensions).fill(0);
            }
            
            const response = await this.hf.featureExtraction({
                model: this.config.name,
                inputs: text
            });
            
            // Convert response to number array and normalize dimensions
            const embedding = this.ensureNumberArray(response);
            return this.normalizeDimensions(embedding, this.config.outputDimensions);
        } catch (error) {
            if (retryCount < this.MAX_RETRIES) {
                // Calculate exponential backoff delay
                const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
                console.warn(`Embedding API call failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`, error);
                
                // Wait before retrying
                await this.sleep(delay);
                
                // Retry with incremented counter
                return this.createEmbeddingWithRetry(text, retryCount + 1);
            }
            
            // If we've exhausted all retries, log and return zero vector
            console.error('Error creating embedding after all retries:', error);
            return Array(this.config.outputDimensions).fill(0);
        }
    }

    async createEmbedding(text: string): Promise<number[]> {
        return this.createEmbeddingWithRetry(text);
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

    private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
        try {
            // Normalize dimensions if they don't match
            if (embedding1.length !== embedding2.length) {
                const targetDim = Math.max(embedding1.length, embedding2.length);
                embedding1 = this.normalizeDimensions(embedding1, targetDim);
                embedding2 = this.normalizeDimensions(embedding2, targetDim);
            }
            
            // Calculate dot product
            const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
            
            // Calculate magnitudes
            const mag1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
            const mag2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
            
            // Avoid division by zero
            if (mag1 === 0 || mag2 === 0) {
                return 0;
            }
            
            // Calculate cosine similarity
            return dotProduct / (mag1 * mag2);
        } catch (error) {
            console.error('Error calculating similarity:', error);
            return 0;
        }
    }

    async classifyChunks(chunks: ChunkMetadata[], categories: string[]): Promise<ChunkMetadata[]> {
        // Create embeddings for each category
        const categoryEmbeddings: { [key: string]: number[] } = {};
        
        // Process each category individually to prevent one failure from stopping all
        for (const category of categories) {
            try {
                categoryEmbeddings[category] = await this.createEmbedding(category);
            } catch (error) {
                console.error(`Failed to create embedding for category "${category}":`, error);
                categoryEmbeddings[category] = Array(this.config.outputDimensions).fill(0);
            }
        }
        
        // Process each chunk individually
        const classifiedChunks: ChunkMetadata[] = [];
        
        for (const chunk of chunks) {
            try {
                // Skip empty chunks
                if (!chunk.content || chunk.content.trim().length === 0) {
                    classifiedChunks.push({...chunk, category: null, similarity: 0});
                    continue;
                }
                
                // Create embedding for chunk content
                const chunkEmbedding = await this.createEmbedding(chunk.content);
                
                // Find the most similar category
                let bestCategory = null;
                let bestSimilarity = -1;
                
                for (const category of categories) {
                    const similarity = this.calculateSimilarity(chunkEmbedding, categoryEmbeddings[category]);
                    
                    if (similarity > bestSimilarity) {
                        bestSimilarity = similarity;
                        bestCategory = category;
                    }
                }
                
                // Only assign category if similarity is above threshold
                if (bestSimilarity >= 0.3) {
                    classifiedChunks.push({...chunk, category: bestCategory, similarity: bestSimilarity});
                } else {
                    classifiedChunks.push({...chunk, category: null, similarity: bestSimilarity});
                }
            } catch (error) {
                console.error(`Failed to classify chunk:`, error);
                classifiedChunks.push({...chunk, category: null, similarity: 0});
            }
        }
        
        return classifiedChunks;
    }
}