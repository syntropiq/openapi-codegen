# Cloudflare Workers Deployment Guide

This guide shows how to deploy the generated API stubs to Cloudflare Workers.

## Prerequisites

1. [Cloudflare account](https://cloudflare.com)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
3. Generated code from OpenAPI stub generator

## Setup

### 1. Initialize Wrangler Project

```bash
# Create new Workers project
mkdir my-api-worker
cd my-api-worker
wrangler init

# Copy generated files
cp -r ../openapi-stub-generator/generated/* ./src/
```

### 2. Configure wrangler.toml

```toml
name = "my-api-worker"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[env.production]
name = "my-api-worker"

[env.staging]
name = "my-api-worker-staging"

# Environment variables
[vars]
API_BASE_URL = "https://api.openai.com/v1"

# Secrets (set via CLI)
# wrangler secret put API_KEY
```

### 3. Set Environment Variables

```bash
# Set secrets (these are encrypted)
wrangler secret put API_KEY
# Enter your OpenAI API key when prompted

# Set regular environment variables
wrangler secret put API_BASE_URL --env production
# Enter: https://api.openai.com/v1
```

### 4. Package.json Setup

```json
{
  "name": "my-api-worker",
  "version": "1.0.0",
  "scripts": {
    "deploy": "wrangler deploy",
    "deploy-staging": "wrangler deploy --env staging",
    "dev": "wrangler dev",
    "tail": "wrangler tail"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20231218.0",
    "typescript": "^5.3.0",
    "wrangler": "^3.0.0"
  }
}
```

### 5. TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "declaration": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Deployment

### Development

```bash
# Start local development server
npm run dev

# Test endpoints locally
curl http://localhost:8787/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'
```

### Staging

```bash
# Deploy to staging
npm run deploy-staging

# Test staging deployment
curl https://my-api-worker-staging.your-subdomain.workers.dev/health
```

### Production

```bash
# Deploy to production
npm run deploy

# Your API is now live at:
# https://my-api-worker.your-subdomain.workers.dev
```

## Custom Domain Setup

### 1. Add Custom Route

```toml
# In wrangler.toml
[[routes]]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"
```

### 2. Deploy with Custom Domain

```bash
wrangler deploy
```

## Monitoring and Debugging

### View Logs

```bash
# Real-time logs
wrangler tail

# Specific environment
wrangler tail --env production
```

### Analytics

```bash
# View analytics
wrangler analytics
```

## Advanced Configuration

### Rate Limiting

```typescript
// Add to your worker
const rateLimiter = new Map();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const clientIP = request.headers.get('CF-Connecting-IP');
    
    // Simple rate limiting
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100;
    
    const key = `${clientIP}:${Math.floor(now / windowMs)}`;
    const count = rateLimiter.get(key) || 0;
    
    if (count >= maxRequests) {
      return new Response('Rate limit exceeded', { status: 429 });
    }
    
    rateLimiter.set(key, count + 1);
    
    // Continue to generated worker
    return await worker.fetch(request, env, ctx);
  }
};
```

### CORS Configuration

```typescript
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return newResponse;
}
```

### Authentication Middleware

```typescript
async function authenticate(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.slice(7);
  // Validate token against your auth service
  return true; // Replace with actual validation
}
```

## Environment-Specific Configuration

### Development

```bash
# wrangler.toml
[env.development]
name = "my-api-worker-dev"
vars = { DEBUG = "true", LOG_LEVEL = "debug" }
```

### Staging

```bash
[env.staging]
name = "my-api-worker-staging"
vars = { DEBUG = "false", LOG_LEVEL = "info" }
```

### Production

```bash
[env.production]
name = "my-api-worker"
vars = { DEBUG = "false", LOG_LEVEL = "error" }
```

## Testing

### Unit Tests

```typescript
// tests/worker.test.ts
import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';

describe('Worker', () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('src/worker.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should return 200 for health check', async () => {
    const resp = await worker.fetch('/health');
    expect(resp.status).toBe(200);
  });
});
```

### Integration Tests

```bash
# Test live endpoints
curl -X POST https://your-worker.workers.dev/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Test message"}],
    "max_tokens": 50
  }'
```

## Performance Optimization

### Enable Caching

```typescript
// Add caching headers
const response = new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300' // 5 minutes
  }
});
```

### Minification

Workers automatically minifies your code during deployment.

## Troubleshooting

### Common Issues

1. **Module not found**: Ensure all imports use relative paths
2. **Environment variables not set**: Use `wrangler secret put` for sensitive data
3. **CORS errors**: Add proper CORS headers
4. **Rate limiting**: Implement proper rate limiting for production

### Debug Mode

```bash
# Enable debug logging
wrangler dev --local --debug
```

## Security Best Practices

1. **Never expose API keys** in code - use Wrangler secrets
2. **Validate all inputs** before processing
3. **Implement rate limiting** to prevent abuse
4. **Use HTTPS only** for production
5. **Sanitize responses** to prevent data leaks

## Cost Optimization

- Workers have a generous free tier (100,000 requests/day)
- Paid plans start at $5/month for 10 million requests
- No cold start delays
- Automatic scaling

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Community Discord](https://discord.gg/cloudflaredev)
