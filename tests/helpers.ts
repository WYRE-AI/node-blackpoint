import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

export function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), 'utf8'));
}

export interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

export function mockFetch(
  impl?: (request: CapturedRequest) => Response | Promise<Response>
): ReturnType<typeof vi.fn> {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
    const headers: Record<string, string> = {};
    const raw = init?.headers;
    if (raw instanceof Headers) {
      raw.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(raw)) {
      for (const pair of raw) {
        const key = pair[0];
        const value = pair[1];
        if (key !== undefined && value !== undefined) {
          headers[key] = value;
        }
      }
    } else if (raw) {
      Object.assign(headers, raw);
    }
    const captured: CapturedRequest = {
      url,
      method: init?.method ?? 'GET',
      headers,
      ...(typeof init?.body === 'string' ? { body: init.body } : {}),
    };
    if (impl) {
      return impl(captured);
    }
    return jsonResponse({ data: [], meta: { currentPage: 1, totalItems: 0, pageSize: 50, totalPages: 1 } });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export function header(request: CapturedRequest, name: string): string | undefined {
  const match = Object.entries(request.headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return match?.[1];
}

export function parsedUrl(request: CapturedRequest): URL {
  return new URL(request.url);
}
