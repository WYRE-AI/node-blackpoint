export interface CompassOneConfig {
  apiToken: string;
  baseUrl?: string;
  timeout?: number;
  userAgent?: string;
}

/** Live CompassOne host. Accepts a base URL with or without a trailing `/v1`. */
export const DEFAULT_BASE_URL = 'https://api.blackpointcyber.com/v1';

export const DEFAULT_CONFIG = {
  baseUrl: DEFAULT_BASE_URL,
  timeout: 30000,
  userAgent: '@wyre-ai/node-blackpoint',
} as const;

/**
 * Published quota for a CompassOne API key: 2000 requests per 15 minutes.
 * The client throttles to this budget so it does not sit under a tighter local cap.
 */
export const RATE_LIMIT_CAPACITY = 2000;
export const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
export const RATE_LIMIT_REFILL_PER_SECOND = RATE_LIMIT_CAPACITY / RATE_LIMIT_WINDOW_SECONDS;

export function validateConfig(config: CompassOneConfig): void {
  if (!config.apiToken) {
    throw new Error('API token is required');
  }
}

/**
 * Normalize a CompassOne base URL.
 * `https://api.blackpointcyber.com` and `https://api.blackpointcyber.com/v1`
 * both become `https://api.blackpointcyber.com/v1`. A `/v1` suffix is not doubled.
 * The scheme must be `https`, except `http` on localhost, `127.0.0.1`, or `[::1]`.
 */
export function resolveBaseUrl(input?: string): string {
  const trimmed = input?.trim() ?? '';
  const raw = trimmed.length > 0 ? trimmed : DEFAULT_BASE_URL;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid base URL: ${raw}`);
  }

  const loopback = url.hostname === 'localhost'
    || url.hostname === '127.0.0.1'
    || url.hostname === '[::1]';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new Error('Base URL must use https');
  }

  const pathname = url.pathname.replace(/\/+$/, '');
  if (pathname === '' || pathname === '/') {
    url.pathname = '/v1';
  } else if (pathname === '/v1' || pathname.endsWith('/v1')) {
    url.pathname = pathname;
  } else {
    url.pathname = `${pathname}/v1`;
  }

  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/+$/, '');
}
