# OpenAPI Stub Generator

A TypeScript tool that generates Cloudflare Workers-compatible API stubs and types from OpenAPI YAML specifications.

## Features

- 🚀 **Cloudflare Workers Native**: Generates code specifically optimized for Cloudflare Workers
- 📝 **Complete Type Generation**: Converts OpenAPI schemas to comprehensive TypeScript interfaces
- 🔄 **Modular Architecture**: Creates separate workers for each route group
- ⚡ **Zero Dependencies**: Generated code runs without external runtime dependencies
- 🛠️ **Configurable**: Support for custom API endpoints and authentication
- 🎯 **AI-Ready**: Optional AI enhancement for business logic (when API key provided)

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Usage

1. Place your OpenAPI YAML file in the `examples/` directory
2. Configure your settings in `src/config/index.ts`
3. Run the generator:

```bash
npm run generate
```

### Advanced Configuration

Edit `src/config/index.ts`:

```typescript
export const config = {
  outputDir: './generated',
  apiKey: process.env.OPENAI_API_KEY, // Optional: for AI enhancement
  apiUrl: 'https://api.openai.com/v1', // Optional: custom AI endpoint
  generateCloudflareWorkers: true,
  enableTypeGeneration: true,
};
```

### Generated Output

The tool generates:

- **`types.ts`**: Complete TypeScript type definitions
- **`api-client.ts`**: Cloudflare Workers-compatible API client
- **`worker.ts`**: Main router that delegates to route-specific workers
- **`*_worker.ts`**: Individual workers for each route group (audio, chat, etc.)

## Generated Code Structure

```
generated/
├── types.ts              # TypeScript interfaces
├── api-client.ts          # API client with fetch methods
├── worker.ts              # Main router worker
├── audio_worker.ts        # Audio-related endpoints
├── chat_worker.ts         # Chat completions
├── assistants_worker.ts   # AI assistants
└── ...                    # Additional route workers
```

## Deployment

### Cloudflare Workers

1. Copy generated files to your Workers project
2. Set environment variables:
   ```
   API_KEY=your_api_key
   API_BASE_URL=https://api.openai.com/v1
   ```
3. Deploy using Wrangler:
   ```bash
   wrangler deploy
   ```

### Example Worker Usage

```typescript
// Import the main worker
import worker from './generated/worker';

export default worker;
```

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd openapi-stub-generator
   ```

3. Install the dependencies:

   ```
   npm install
   ```

### Usage

1. Configure the API endpoint and key in `src/config/index.ts`.

2. Place your OpenAPI YAML file in the `examples` directory.

3. Run the generator:

   ```
   npm run generate
   ```

4. Check the `dist` directory for the generated stubs and types.

### Example

Refer to `examples/basic-usage.ts` for a demonstration of how to use the stub generator tool with a sample OpenAPI YAML file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.