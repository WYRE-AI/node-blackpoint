export interface CompassOneConfig {
  apiToken: string;
  baseUrl?: string;
  timeout?: number;
  userAgent?: string;
}

export const DEFAULT_CONFIG = {
  baseUrl: 'https://api.compassone.blackpointcyber.com/v1',
  timeout: 30000,
  userAgent: '@wyre-ai/node-blackpoint',
} as const;

export function validateConfig(config: CompassOneConfig): void {
  if (!config.apiToken) {
    throw new Error('API token is required');
  }
}