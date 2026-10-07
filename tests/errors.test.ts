import { describe, expect, it } from 'vitest';
import { NotEntitledError, ServiceError, redactSensitive } from '../src/errors.js';

const TOKEN = 'super-secret-token-value';

describe('redactSensitive', () => {
  it('redacts bearer tokens, the configured secret, and authorization fields', () => {
    const redacted = redactSensitive({
      message: `Bearer ${TOKEN} leaked`,
      authorization: `Bearer ${TOKEN}`,
      nested: [{ echo: TOKEN }, 4, null],
    }, TOKEN) as {
      message: string;
      authorization: string;
      nested: unknown[];
    };

    expect(redacted.message).toBe('Bearer [REDACTED] leaked');
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.nested[0]).toEqual({ echo: '[REDACTED]' });
    expect(JSON.stringify(redacted)).not.toContain(TOKEN);
  });

  it('leaves short secrets and non-strings alone', () => {
    expect(redactSensitive('abc', 'ab')).toBe('abc');
    expect(redactSensitive(12, TOKEN)).toBe(12);
  });
});

describe('ServiceError', () => {
  it('serializes status, path, and body without the token', () => {
    const error = new NotEntitledError(
      `nope Bearer ${TOKEN}`,
      { detail: TOKEN, authorization: 'Bearer abc' },
      '/v1/vulnerabilities',
      'GET',
      TOKEN
    );

    expect(error.status).toBe(403);
    expect(error.statusCode).toBe(403);
    expect(error).toBeInstanceOf(ServiceError);
    const json = error.toJSON();
    expect(json).toMatchObject({
      name: 'NotEntitledError',
      status: 403,
      method: 'GET',
      path: '/v1/vulnerabilities',
    });
    expect(JSON.stringify(error)).not.toContain(TOKEN);
    expect(JSON.stringify(error)).not.toBe('{}');
  });
});
