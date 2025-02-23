import dotenv from 'dotenv';

dotenv.config();

interface Config {
    openai: {
        apiKey: string;
    };
}

export const config: Config = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY || ''
    }
}; 