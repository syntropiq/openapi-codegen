import { OpenAPISpec, GeneratedFile, Config } from '../config/types';
import { parseOpenApiYaml } from './parser';
import { generateTypes } from './types-generator';
import { generateStubs } from './stubs-generator';
import { writeGeneratedFiles } from '../utils/file-utils';

export class Generator {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public async generateFromYaml(yamlFilePath: string): Promise<GeneratedFile[]> {
    try {
      // Parse the OpenAPI YAML file
      console.log(`Parsing OpenAPI file: ${yamlFilePath}`);
      const spec = parseOpenApiYaml(yamlFilePath);
      
      // Generate TypeScript types
      console.log('Generating TypeScript types...');
      const typesFile = generateTypes(spec);
      
      // Generate API client stubs
      console.log('Generating API client stubs...');
      const stubFiles = generateStubs(spec, this.config);
      
      // Combine all generated files
      const allFiles = [typesFile, ...stubFiles];
      
      // Write files to output directory
      await writeGeneratedFiles(allFiles, this.config.outputDir);
      
      console.log(`✅ Successfully generated ${allFiles.length} files in ${this.config.outputDir}`);
      
      return allFiles;
    } catch (error: any) {
      console.error('❌ Generation failed:', error.message);
      throw error;
    }
  }

  public async enhanceWithAI(spec: OpenAPISpec, operationId: string): Promise<string> {
    if (!this.config.apiKey || this.config.apiKey === 'your-api-key-here') {
      console.warn('⚠️  No API key configured. Skipping AI enhancement.');
      return this.generateBasicStub(operationId);
    }

    try {
      const prompt = this.buildAIPrompt(spec, operationId);
      const enhancedCode = await this.callAIAPI(prompt);
      return enhancedCode;
    } catch (error: any) {
      console.warn(`⚠️  AI enhancement failed for ${operationId}: ${error.message}`);
      return this.generateBasicStub(operationId);
    }
  }

  private buildAIPrompt(spec: OpenAPISpec, operationId: string): string {
    const operation = this.findOperation(spec, operationId);
    
    return `Generate a Cloudflare Workers compatible TypeScript function for this OpenAPI operation:

Operation ID: ${operationId}
Description: ${operation?.description || 'No description provided'}
Method: ${operation?.method || 'Unknown'}
Path: ${operation?.path || 'Unknown'}

Requirements:
- Use TypeScript
- Compatible with Cloudflare Workers runtime
- Include proper error handling
- Return appropriate HTTP responses
- Include TODO comments for business logic implementation

Please generate only the function implementation, not the full file structure.`;
  }

  private async callAIAPI(prompt: string): Promise<string> {
    const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a TypeScript expert specializing in Cloudflare Workers development.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || this.generateBasicStub('unknown');
  }

  private findOperation(spec: OpenAPISpec, operationId: string): any {
    for (const [path, pathItem] of Object.entries(spec.paths || {})) {
      if (!pathItem) continue;
      
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];
      
      for (const method of methods) {
        const operation = pathItem[method as keyof typeof pathItem];
        if (operation?.operationId === operationId) {
          return { ...operation, path, method };
        }
      }
    }
    return null;
  }

  private generateBasicStub(operationId: string): string {
    return `
// TODO: Implement ${operationId}
export async function ${operationId}(request: Request): Promise<Response> {
  // Add your business logic here
  return new Response(JSON.stringify({ 
    message: "Not implemented", 
    operation: "${operationId}" 
  }), {
    status: 501,
    headers: { "Content-Type": "application/json" }
  });
}`;
  }
}

export default Generator;