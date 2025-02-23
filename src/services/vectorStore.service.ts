import { Document } from '../types/document';

export class VectorStore {
    private documents: Document[] = [];

    async addDocument(document: Document): Promise<void> {
        this.documents.push(document);
    }

    async search(queryEmbedding: number[], limit: number = 3): Promise<Document[]> {
        // Calculate cosine similarity between query and all documents
        const similarities = this.documents.map(doc => ({
            document: doc,
            similarity: this.cosineSimilarity(queryEmbedding, doc.embedding)
        }));

        // Sort by similarity (highest first) and return top N results
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(result => result.document);
    }

    async clear(): Promise<void> {
        this.documents = [];
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error("Vectors must have same length");
        }

        const dotProduct = a.reduce((sum, _, i) => sum + a[i] * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

        return dotProduct / (magnitudeA * magnitudeB);
    }
}

export const vectorStore = new VectorStore(); 