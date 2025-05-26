// Example of enhanced main worker with environment variable usage and middleware
// This demonstrates best practices for production deployment

import assistantsWorker from "./assistants_worker";
import audioWorker from "./audio_worker";
import batchesWorker from "./batches_worker";
import chatWorker from "./chat_worker";
import completionsWorker from "./completions_worker";
import embeddingsWorker from "./embeddings_worker";
import evalsWorker from "./evals_worker";
import filesWorker from "./files_worker";
import fine_tuningWorker from "./fine_tuning_worker";
import imagesWorker from "./images_worker";
import modelsWorker from "./models_worker";
import moderationsWorker from "./moderations_worker";
import organizationWorker from "./organization_worker";
import realtimeWorker from "./realtime_worker";
import responsesWorker from "./responses_worker";
import threadsWorker from "./threads_worker";
import uploadsWorker from "./uploads_worker";
import vector_storesWorker from "./vector_stores_worker";

interface Env {
  API_KEY?: string;
  API_BASE_URL?: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_PER_MINUTE?: string;
  DEBUG?: string;
}

interface RequestContext {
  startTime: number;
  requestId: string;
  clientIP: string;
}

// Rate limiting store (in production, use Durable Objects or KV)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    const requestContext: RequestContext = {
      startTime,
      requestId,
      clientIP
    };

    // Debug logging
    if (env.DEBUG === 'true') {
      console.log(`[${requestId}] ${request.method} ${request.url} from ${clientIP}`);
    }

    try {
      // CORS preflight handling
      if (request.method === 'OPTIONS') {
        return this.handleCors(request, env);
      }

      // Health check endpoint
      const url = new URL(request.url);
      if (url.pathname === '/health' || url.pathname === '/health/') {
        return this.handleHealthCheck(env, requestContext);
      }

      // API key validation
      const authResult = this.validateAuth(request, env);
      if (!authResult.valid) {
        return new Response(JSON.stringify({ error: authResult.error }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Rate limiting
      const rateLimitResult = this.checkRateLimit(clientIP, env);
      if (!rateLimitResult.allowed) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter 
        }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter.toString()
          }
        });
      }

      // Route to appropriate worker
      const response = await this.routeRequest(request, env, ctx);
      
      // Add response headers and logging
      return this.enhanceResponse(response, env, requestContext);
      
    } catch (error: any) {
      console.error(`[${requestId}] Router error:`, error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          requestId: env.DEBUG === 'true' ? requestId : undefined
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },

  handleCors(request: Request, env: Env): Response {
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*'];
    const origin = request.headers.get('Origin') || '';
    
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    };

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin || '*';
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  },

  handleHealthCheck(env: Env, context: RequestContext): Response {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      version: '1.0.0',
      environment: {
        hasApiKey: !!env.API_KEY,
        apiBaseUrl: env.API_BASE_URL || 'https://api.openai.com/v1',
        debug: env.DEBUG === 'true'
      }
    };

    return new Response(JSON.stringify(health, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  },

  validateAuth(request: Request, env: Env): { valid: boolean; error?: string } {
    // Skip auth for health checks
    const url = new URL(request.url);
    if (url.pathname === '/health' || url.pathname === '/health/') {
      return { valid: true };
    }

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return { valid: false, error: 'Authorization header required' };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Invalid authorization format' };
    }

    const token = authHeader.slice(7);
    if (!token) {
      return { valid: false, error: 'Missing API key' };
    }

    // In production, validate against your auth service
    // For now, just check if we have an API key configured
    if (!env.API_KEY) {
      return { valid: false, error: 'API key not configured' };
    }

    return { valid: true };
  },

  checkRateLimit(clientIP: string, env: Env): { allowed: boolean; retryAfter?: number } {
    const limit = parseInt(env.RATE_LIMIT_PER_MINUTE || '60');
    const windowMs = 60 * 1000; // 1 minute
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const key = `${clientIP}:${windowStart}`;

    const current = rateLimitStore.get(key) || { count: 0, resetTime: windowStart + windowMs };
    
    if (current.count >= limit) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    rateLimitStore.set(key, { 
      count: current.count + 1, 
      resetTime: current.resetTime 
    });

    // Clean up old entries
    this.cleanupRateLimit(now, windowMs);

    return { allowed: true };
  },

  cleanupRateLimit(now: number, windowMs: number): void {
    const cutoff = now - windowMs;
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < cutoff) {
        rateLimitStore.delete(key);
      }
    }
  },

  async routeRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const routePrefix = pathSegments[0] || "root";

    // Route to appropriate worker based on path prefix
    switch (routePrefix) {
      case "assistants":
        return await assistantsWorker.fetch(request, env, ctx);
      case "audio":
        return await audioWorker.fetch(request, env, ctx);
      case "batches":
        return await batchesWorker.fetch(request, env, ctx);
      case "chat":
        return await chatWorker.fetch(request, env, ctx);
      case "completions":
        return await completionsWorker.fetch(request, env, ctx);
      case "embeddings":
        return await embeddingsWorker.fetch(request, env, ctx);
      case "evals":
        return await evalsWorker.fetch(request, env, ctx);
      case "files":
        return await filesWorker.fetch(request, env, ctx);
      case "fine_tuning":
        return await fine_tuningWorker.fetch(request, env, ctx);
      case "images":
        return await imagesWorker.fetch(request, env, ctx);
      case "models":
        return await modelsWorker.fetch(request, env, ctx);
      case "moderations":
        return await moderationsWorker.fetch(request, env, ctx);
      case "organization":
        return await organizationWorker.fetch(request, env, ctx);
      case "realtime":
        return await realtimeWorker.fetch(request, env, ctx);
      case "responses":
        return await responsesWorker.fetch(request, env, ctx);
      case "threads":
        return await threadsWorker.fetch(request, env, ctx);
      case "uploads":
        return await uploadsWorker.fetch(request, env, ctx);
      case "vector_stores":
        return await vector_storesWorker.fetch(request, env, ctx);
      default:
        return new Response(JSON.stringify({ 
          error: 'Not Found',
          availableRoutes: [
            'assistants', 'audio', 'batches', 'chat', 'completions',
            'embeddings', 'evals', 'files', 'fine_tuning', 'images',
            'models', 'moderations', 'organization', 'realtime',
            'responses', 'threads', 'uploads', 'vector_stores'
          ]
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  },

  enhanceResponse(response: Response, env: Env, context: RequestContext): Response {
    const duration = Date.now() - context.startTime;
    
    // Clone response to add headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    // Add custom headers
    newResponse.headers.set('X-Request-ID', context.requestId);
    newResponse.headers.set('X-Response-Time', `${duration}ms`);
    
    // CORS headers for actual requests
    if (env.ALLOWED_ORIGINS) {
      const allowedOrigins = env.ALLOWED_ORIGINS.split(',');
      if (allowedOrigins.includes('*')) {
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
      }
    }

    // Security headers
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');

    // Debug logging
    if (env.DEBUG === 'true') {
      console.log(`[${context.requestId}] Response: ${response.status} (${duration}ms)`);
    }

    return newResponse;
  }
};
