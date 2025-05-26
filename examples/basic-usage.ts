import { Generator } from '../src/generator';
import { config } from '../src/config';

const openApiFilePath = './examples/openapi.yaml';
const apiKey = config.apiKey; // Retrieve API key from config
const apiUrl = config.apiUrl; // Retrieve API endpoint URL from config

async function main() {
    const generator = new Generator(openApiFilePath, apiKey, apiUrl);
    
    try {
        await generator.generate();
        console.log('Stubs and types generated successfully.');
    } catch (error) {
        console.error('Error generating stubs and types:', error);
    }
}

main();