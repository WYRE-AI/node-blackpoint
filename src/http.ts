import { CompassOneConfig, DEFAULT_CONFIG, resolveBaseUrl } from './config.js';
import { RateLimiter } from './rate-limiter.js';
import { applyPaginationMeta, buildQueryString, normalizePath } from './pagination.js';
import {
  ServiceError,
  AuthenticationError,
  NotEntitledError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
} from './errors.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  /**
   * Tenant id sent as `x-tenant-id`. When set, `tenantId` is removed from the
   * query string so it is not also sent as a parameter.
   */
  tenantId?: string;
  /**
   * Set on routes whose HTTP path could not be confirmed. A 403 or 404 is
   * still thrown as NotEntitledError / NotFoundError, with this note prefixed
   * so the failure is not an opaque status.
   */
  pathNote?: string;
  /** Internal: one automatic retry after Retry-After has already run. */
  rateLimitRetried?: boolean;
}

export class HttpClient {
  private readonly config: Required<CompassOneConfig>;
  private readonly rateLimiter: RateLimiter;

  constructor(config: CompassOneConfig) {
    this.config = {
      apiToken: config.apiToken,
      baseUrl: resolveBaseUrl(config.baseUrl),
      timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
      userAgent: config.userAgent ?? DEFAULT_CONFIG.userAgent,
    };

    this.rateLimiter = new RateLimiter();
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    await this.rateLimiter.acquire();

    const method = options.method ?? 'GET';
    const params = this.queryParams(options);
    const url = this.buildUrl(endpoint, params);
    const path = this.requestPath(url);
    const requestOptions: RequestInit = {
      method,
      headers: this.buildHeaders(options.headers, options.tenantId),
      signal: AbortSignal.timeout(options.timeout ?? this.config.timeout),
    };

    if (options.body !== undefined && method !== 'GET') {
      requestOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, requestOptions);
      return await this.handleResponse<T>(response, path, method, endpoint, options);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
        throw new ServiceError('Request timeout', 408, null, path, method, this.config.apiToken);
      }
      throw error;
    }
  }

  private queryParams(options: RequestOptions): Record<string, unknown> | undefined {
    if (!options.params) {
      return undefined;
    }
    if (!options.tenantId || !Object.prototype.hasOwnProperty.call(options.params, 'tenantId')) {
      return options.params;
    }
    const rest = { ...options.params };
    delete rest.tenantId;
    return rest;
  }

  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const normalizedEndpoint = normalizePath(endpoint);
    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;
    const url = `${baseUrl}${normalizedEndpoint}`;
    const queryString = params ? buildQueryString(params) : '';
    return `${url}${queryString}`;
  }

  private requestPath(url: string): string {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  }

  private buildHeaders(
    additionalHeaders?: Record<string, string>,
    tenantId?: string
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': this.config.userAgent,
      ...additionalHeaders,
    };

    if (tenantId) {
      headers['x-tenant-id'] = tenantId;
    }

    return headers;
  }

  private async handleResponse<T>(
    response: Response,
    path: string,
    method: string,
    endpoint: string,
    options: RequestOptions
  ): Promise<T> {
    if (response.ok) {
      if (response.status === 204) {
        return {} as T;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          const parsed = await response.json() as T;
          return applyPaginationMeta(parsed);
        } catch {
          throw new ServiceError(
            'Invalid JSON response',
            response.status,
            null,
            path,
            method,
            this.config.apiToken
          );
        }
      }

      return {} as T;
    }

    let responseBody: unknown;
    const rawText = await response.text();
    try {
      responseBody = rawText.length > 0 ? JSON.parse(rawText) : null;
    } catch {
      responseBody = rawText;
    }

    const serverMessage = this.extractErrorMessage(responseBody) || response.statusText || 'Unknown error';
    const message = options.pathNote
      ? `${options.pathNote} ${serverMessage}`
      : serverMessage;
    const secret = this.config.apiToken;

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message, responseBody, path, method, secret);
      case 403:
        throw new NotEntitledError(message, responseBody, path, method, secret);
      case 404:
        throw new NotFoundError(message, responseBody, path, method, secret);
      case 400: {
        const errors = this.extractValidationErrors(responseBody);
        throw new ValidationError(message, errors, responseBody, path, method, secret);
      }
      case 429: {
        const retryAfter = this.extractRetryAfter(response);
        const timeoutMs = options.timeout ?? this.config.timeout;
        const waitMs = retryAfter.seconds * 1000;
        if (retryAfter.retry && !options.rateLimitRetried && waitMs <= timeoutMs) {
          await new Promise(resolve => setTimeout(resolve, waitMs));
          return this.request(endpoint, { ...options, rateLimitRetried: true });
        }
        throw new RateLimitError(message, retryAfter.seconds, responseBody, path, method, secret);
      }
      default: {
        if (response.status >= 500) {
          throw new ServerError(message, response.status, responseBody, path, method, secret);
        }
        throw new ServiceError(message, response.status, responseBody, path, method, secret);
      }
    }
  }

  private extractErrorMessage(responseBody: unknown): string | null {
    if (typeof responseBody === 'string') {
      return responseBody;
    }

    if (typeof responseBody === 'object' && responseBody !== null) {
      const obj = responseBody as Record<string, unknown>;
      const message = obj.message ?? obj.error ?? obj.detail;
      return typeof message === 'string' ? message : null;
    }

    return null;
  }

  private extractValidationErrors(responseBody: unknown): Array<{ field: string; message: string }> {
    if (typeof responseBody === 'object' && responseBody !== null) {
      const obj = responseBody as Record<string, unknown>;
      if (Array.isArray(obj.errors)) {
        return obj.errors as Array<{ field: string; message: string }>;
      }
      if (obj.errors && typeof obj.errors === 'object') {
        return Object.entries(obj.errors as Record<string, unknown>).map(([field, message]) => ({
          field,
          message: String(message),
        }));
      }
    }
    return [];
  }

  private extractRetryAfter(response: Response): { seconds: number; retry: boolean } {
    const retryAfter = response.headers.get('Retry-After');
    if (!retryAfter) {
      return { seconds: 60, retry: false };
    }
    const seconds = parseInt(retryAfter, 10);
    if (Number.isNaN(seconds)) {
      return { seconds: 60, retry: false };
    }
    return { seconds, retry: seconds > 0 };
  }
}
