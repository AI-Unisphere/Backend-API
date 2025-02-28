import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../config/swagger';

/**
 * Script to generate Swagger documentation as a static JSON file
 * This can be useful for sharing the API documentation or for frontend integration
 */

const outputDir = path.join(process.cwd(), 'docs');
const outputPath = path.join(outputDir, 'swagger.json');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Write the Swagger specification to a file
fs.writeFileSync(
    outputPath,
    JSON.stringify(swaggerSpec, null, 2),
    { encoding: 'utf8' }
);

console.log(`Swagger documentation generated at: ${outputPath}`);
console.log('You can now:');
console.log('1. Start the server to access the Swagger UI at /api-docs');
console.log('2. Use the generated JSON file with any Swagger UI tool'); 