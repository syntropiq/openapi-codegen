export interface Config {
  apiUrl: string;
  apiKey: string;
  outputDir: string;
  generateCloudflareWorker: boolean;
}

export const defaultConfig: Config = {
  apiUrl: process.env.API_URL || 'https://api.openai.com/v1',
  apiKey: process.env.API_KEY || 'your-api-key-here',
  outputDir: process.env.OUTPUT_DIR || './generated',
  generateCloudflareWorker: process.env.GENERATE_CF_WORKER === 'true' || true,
};

export const config = defaultConfig;