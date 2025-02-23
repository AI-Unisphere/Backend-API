import { HfInference } from '@huggingface/inference';
import { config } from 'dotenv';

config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function testAccess() {
    console.log('Testing access to Hugging Face models...');

    try {
        // Test LLM access
        console.log('\nTesting access to Granite 3.1-2B-Instruct...');
        const llmResponse = await hf.textGeneration({
            model: 'ibm-granite/granite-3.1-2b-instruct',
            inputs: '<|system|>You are a helpful assistant.<|user|>Say hello!<|assistant|>',
            parameters: {
                max_new_tokens: 10,
                return_full_text: false
            }
        });
        console.log('✅ Successfully accessed Granite 3.1-2B-Instruct');
        console.log('Response:', llmResponse.generated_text);

        // Test embedding access
        console.log('\nTesting access to Granite Embedding model...');
        const embeddingResponse = await hf.featureExtraction({
            model: 'ibm-granite/granite-embedding-30m-english',
            inputs: 'Hello, testing embeddings!'
        });
        console.log('✅ Successfully accessed Granite Embedding model');
        console.log('Embedding dimensions:', Array.isArray(embeddingResponse) ? embeddingResponse.length : 'unexpected format');

    } catch (error: any) {
        console.error('❌ Error accessing models:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response message:', await error.response.text());
        }
    }
}

testAccess().catch(console.error); 