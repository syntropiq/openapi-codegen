import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { OpenAPISpec } from '../config/types';

/**
 * Parse OpenAPI YAML file into a structured object
 */
export function parseOpenApiYaml(filePath: string): OpenAPISpec {
  try {
    const fileContents = readFileSync(filePath, 'utf8');
    const parsedData = yaml.load(fileContents) as OpenAPISpec;
    
    if (!parsedData || !parsedData.openapi) {
      throw new Error('Invalid OpenAPI YAML file: Missing required fields.');
    }

    return parsedData;
  } catch (error: any) {
    throw new Error(`Failed to parse OpenAPI YAML file: ${error.message}`);
  }
}