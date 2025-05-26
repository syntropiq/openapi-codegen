// OpenAPI Stub Generator
// Generates TypeScript stubs and types from OpenAPI YAML files
// Compatible with Cloudflare Workers

import { Generator } from './generator';
import { config } from './config';
import { resolve } from 'path';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🚀 OpenAPI Stub Generator

Usage: npm start <path-to-openapi.yaml>

Options:
  Set environment variables to configure:
  - API_URL: OpenAI API compatible endpoint (default: https://api.openai.com/v1)
  - API_KEY: API key for AI enhancement
  - OUTPUT_DIR: Output directory (default: ./generated)
  - GENERATE_CF_WORKER: Generate Cloudflare Worker (default: true)

Example:
  npm start ./api/openapi.yaml
  
  # With custom output directory
  OUTPUT_DIR=./src/generated npm start ./api/openapi.yaml
    `);
    process.exit(1);
  }

  const yamlFilePath = resolve(args[0]);
  
  console.log('🔧 Configuration:');
  console.log(`  Input file: ${yamlFilePath}`);
  console.log(`  Output directory: ${config.outputDir}`);
  console.log(`  API URL: ${config.apiUrl}`);
  console.log(`  Generate Cloudflare Worker: ${config.generateCloudflareWorker}`);
  console.log(`  AI Enhancement: ${config.apiKey !== 'your-api-key-here' ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('');

  try {
    const generator = new Generator(config);
    const files = await generator.generateFromYaml(yamlFilePath);
    
    console.log('');
    console.log('📁 Generated files:');
    files.forEach(file => {
      console.log(`  ✅ ${file.path} - ${file.description}`);
    });
    
    console.log('');
    console.log('🎉 Generation completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the generated files');
    console.log('2. Implement the TODO business logic');
    console.log('3. Deploy to Cloudflare Workers (if applicable)');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

// Export for programmatic use
export { Generator } from './generator';
export { config } from './config';
export * from './config/types';