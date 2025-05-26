// Example demonstrating how to use the generated Cloudflare Workers
import worker from '../generated/worker';
import { ApiClient } from '../generated/api-client';
import type { 
  CreateChatCompletionRequest, 
  CreateChatCompletionResponse,
  AssistantObject 
} from '../generated/types';

// 1. Basic Worker Deployment Example
export default worker;

// 2. Custom API Client Usage Example
export class ExampleApiUsage {
  private client: ApiClient;

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new ApiClient({
      apiKey,
      baseUrl: baseUrl || 'https://api.openai.com/v1'
    });
  }

  // Example: Create a chat completion
  async createChatCompletion(request: CreateChatCompletionRequest): Promise<CreateChatCompletionResponse> {
    const response = await this.client.createChatCompletion(request);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json() as CreateChatCompletionResponse;
  }

  // Example: List assistants
  async listAssistants(query?: Record<string, any>): Promise<AssistantObject[]> {
    const response = await this.client.listAssistants(query);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  }
}

// 3. Environment Configuration Example
export const exampleEnv = {
  API_KEY: 'your-openai-api-key-here',
  API_BASE_URL: 'https://api.openai.com/v1'
};

// 4. Custom Worker with Business Logic Example
export const customWorker = {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Add custom middleware or business logic here
    if (url.pathname.startsWith('/health')) {
      return new Response('OK', { status: 200 });
    }
    
    // Route to generated worker for API endpoints
    if (url.pathname.startsWith('/v1/') || url.pathname.startsWith('/chat/')) {
      return await worker.fetch(request, env, ctx);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

// 5. Type-safe Request Examples
export const exampleRequests = {
  // Chat completion request
  chatRequest: {
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, world!' }
    ],
    max_tokens: 100,
    temperature: 0.7
  } as CreateChatCompletionRequest,

  // Assistant creation request
  assistantRequest: {
    name: 'Math Tutor',
    instructions: 'You are a personal math tutor.',
    model: 'gpt-4',
    tools: [{ type: 'code_interpreter' }]
  }
};

// 6. Error Handling Example
export async function handleApiCall<T>(
  apiCall: () => Promise<Response>
): Promise<T> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
