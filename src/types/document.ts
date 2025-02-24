export interface Document {
    id: string;
    content: string;
    embedding: number[];
    metadata?: {
        category?: string;
        confidence?: number;
        [key: string]: any;
    };
} 