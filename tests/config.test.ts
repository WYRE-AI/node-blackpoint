import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BASE_URL,
  resolveBaseUrl,
  validateConfig,
  RATE_LIMIT_CAPACITY,
  RATE_LIMIT_WINDOW_SECONDS,
} from '../src/config.js';

describe('resolveBaseUrl', () => {
  it('defaults to the live CompassOne host', () => {
    expect(resolveBaseUrl()).toBe(DEFAULT_BASE_URL);
    expect(resolveBaseUrl('   ')).toBe('https://api.blackpointcyber.com/v1');
  });

  it('appends /v1 when the host has no version segment', () => {
    expect(resolveBaseUrl('https://api.blackpointcyber.com')).toBe('https://api.blackpointcyber.com/v1');
    expect(resolveBaseUrl('https://api.blackpointcyber.com/')).toBe('https://api.blackpointcyber.com/v1');
  });

  it('does not double /v1', () => {
    expect(resolveBaseUrl('https://api.blackpointcyber.com/v1')).toBe('https://api.blackpointcyber.com/v1');
    expect(resolveBaseUrl('https://api.blackpointcyber.com/v1/')).toBe('https://api.blackpointcyber.com/v1');
    expect(resolveBaseUrl('https://proxy.example/blackpoint/v1')).toBe('https://proxy.example/blackpoint/v1');
  });

  it('appends /v1 to a non-version path prefix', () => {
    expect(resolveBaseUrl('https://proxy.example/blackpoint')).toBe('https://proxy.example/blackpoint/v1');
  });

  it('rejects a base URL that is not a URL', () => {
    expect(() => resolveBaseUrl('not a url')).toThrow(/Invalid base URL/);
  });

  it('rejects non-https hosts that are not loopback', () => {
    expect(() => resolveBaseUrl('http://evil.example')).toThrow(/https/);
    expect(() => resolveBaseUrl('http://api.blackpointcyber.com')).toThrow(/https/);
  });

  it('allows http only for loopback and still appends /v1', () => {
    expect(resolveBaseUrl('http://localhost:9')).toBe('http://localhost:9/v1');
    expect(resolveBaseUrl('http://127.0.0.1')).toBe('http://127.0.0.1/v1');
    expect(resolveBaseUrl('http://[::1]:9')).toBe('http://[::1]:9/v1');
  });
});

describe('validateConfig', () => {
  it('requires an API token', () => {
    expect(() => validateConfig({ apiToken: '' })).toThrow(/API token is required/);
  });

  it('accepts a token', () => {
    expect(() => validateConfig({ apiToken: 'key' })).not.toThrow();
  });
});

describe('rate limit constants', () => {
  it('matches 2000 requests per 15 minutes', () => {
    expect(RATE_LIMIT_CAPACITY).toBe(2000);
    expect(RATE_LIMIT_WINDOW_SECONDS).toBe(15 * 60);
  });
});
