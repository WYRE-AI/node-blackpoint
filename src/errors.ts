export interface ServiceErrorBody {
  name: string;
  message: string;
  status: number;
  method: string;
  path: string;
  body: unknown;
}

const MIN_SECRET_LENGTH = 8;

/** Remove bearer tokens and `Authorization` values before an error is logged or thrown. */
export function redactSensitive(value: unknown, secret?: string): unknown {
  const scrub = (text: string): string => {
    let out = text.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');
    if (secret && secret.length >= MIN_SECRET_LENGTH && out.includes(secret)) {
      out = out.split(secret).join('[REDACTED]');
    }
    return out;
  };

  const walk = (input: unknown): unknown => {
    if (typeof input === 'string') {
      return scrub(input);
    }
    if (Array.isArray(input)) {
      return input.map(item => walk(item));
    }
    if (input && typeof input === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(input as Record<string, unknown>)) {
        if (/^authorization$/i.test(key)) {
          out[key] = '[REDACTED]';
          continue;
        }
        out[key] = walk(child);
      }
      return out;
    }
    return input;
  };

  return walk(value);
}

export class ServiceError extends Error {
  readonly status: number;
  readonly statusCode: number;
  readonly method: string;
  readonly path: string;
  readonly body: unknown;
  readonly response: unknown;

  constructor(
    message: string,
    statusCode: number,
    response: unknown,
    path = '',
    method = 'GET',
    secret?: string
  ) {
    const body = redactSensitive(response, secret);
    const safeMessage = typeof message === 'string'
      ? redactSensitive(message, secret) as string
      : message;
    super(safeMessage);
    this.name = 'ServiceError';
    this.status = statusCode;
    this.statusCode = statusCode;
    this.method = method;
    this.path = path;
    this.body = body;
    this.response = body;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Serializable shape. `JSON.stringify` on a bare `Error` is `{}`. */
  toJSON(): ServiceErrorBody {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      method: this.method,
      path: this.path,
      body: this.body,
    };
  }
}

export class AuthenticationError extends ServiceError {
  constructor(message: string, response: unknown, path = '', method = 'GET', secret?: string) {
    super(message, 401, response, path, method, secret);
    this.name = 'AuthenticationError';
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string, response: unknown, path = '', method = 'GET', secret?: string) {
    super(message, 403, response, path, method, secret);
    this.name = 'ForbiddenError';
  }
}

/**
 * HTTP 403 from CompassOne. Vulnerability and scan routes return this for an
 * account that is not entitled to the product; the path itself exists.
 */
export class NotEntitledError extends ForbiddenError {
  constructor(message: string, response: unknown, path = '', method = 'GET', secret?: string) {
    super(message, response, path, method, secret);
    this.name = 'NotEntitledError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string, response: unknown, path = '', method = 'GET', secret?: string) {
    super(message, 404, response, path, method, secret);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ServiceError {
  readonly errors: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    errors: Array<{ field: string; message: string }>,
    response: unknown,
    path = '',
    method = 'GET',
    secret?: string
  ) {
    super(message, 400, response, path, method, secret);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class RateLimitError extends ServiceError {
  readonly retryAfter: number;

  constructor(
    message: string,
    retryAfter: number,
    response: unknown,
    path = '',
    method = 'GET',
    secret?: string
  ) {
    super(message, 429, response, path, method, secret);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends ServiceError {
  constructor(
    message: string,
    statusCode: number,
    response: unknown,
    path = '',
    method = 'GET',
    secret?: string
  ) {
    super(message, statusCode, response, path, method, secret);
    this.name = 'ServerError';
  }
}
