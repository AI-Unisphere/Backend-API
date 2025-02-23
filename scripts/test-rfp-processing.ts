import { RfpGenerationService } from '../src/services/rfpGeneration.service';
import fs from 'fs';
import path from 'path';

async function testRfpProcessing() {
    console.log('Testing RFP document processing...');
    
    try {
        const rfpService = new RfpGenerationService();
        
        // Read a sample PDF document
        const documentPath = path.join(process.cwd(), 'test-data', 'sample-rfp.pdf');
        const documentContent = fs.readFileSync(documentPath, 'utf-8');
        
        console.log('\nExtracting information from document...');
        const rfpInfo = await rfpService.extractRfpInfo(documentContent);
        
        console.log('\n✅ Successfully processed document');
        console.log('\nExtracted Information:');
        console.log(JSON.stringify(rfpInfo, null, 2));
        
    } catch (error: any) {
        console.error('\n❌ Error processing document:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response message:', await error.response.text());
        }
    }
}

testRfpProcessing().catch(console.error); 