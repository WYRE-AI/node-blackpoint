import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../src/http.js';
import {
  AuthenticationError,
  NotEntitledError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ServiceError,
  ValidationError,
} from '../src/errors.js';
import { header, jsonResponse, loadFixture, mockFetch, parsedUrl } from './helpers.js';

const TOKEN = 'super-secret-token-value';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function client(baseUrl?: string): HttpClient {
  return new HttpClient({
    apiToken: TOKEN,
    ...(baseUrl ? { baseUrl } : {}),
    timeout: 30_000,
  });
}

describe('HttpClient', () => {
  it('uses the live host and copies meta onto pagination', async () => {
    const tenants = loadFixture('tenants-page.json');
    const fetchMock = mockFetch(() => jsonResponse(tenants));
    const page = await client().request<typeof tenants>('/tenants/');
    const request = fetchMock.mock.calls[0];
    expect(request).toBeDefined();
    const captured = {
      url: String(request?.[0]),
      method: 'GET',
      headers: (request?.[1] as RequestInit).headers as Record<string, string>,
    };
    const url = new URL(captured.url);
    expect(url.origin + url.pathname).toBe('https://api.blackpointcyber.com/v1/tenants');
    expect(header({ ...captured, method: 'GET' }, 'authorization')).toBe(`Bearer ${TOKEN}`);
    expect(page).toMatchObject({
      pagination: { page: 1, totalCount: 3, pageSize: 1, totalPages: 3, hasNext: true },
    });
  });

  it('accepts a base URL without /v1', async () => {
    const fetchMock = mockFetch();
    await client('https://api.blackpointcyber.com').request('/accounts', { params: { limit: 1 } });
    const url = parsedUrl({
      url: String(fetchMock.mock.calls[0]?.[0]),
      method: 'GET',
      headers: {},
    });
    expect(url.href).toBe('https://api.blackpointcyber.com/v1/accounts?limit=1');
  });

  it('sends x-tenant-id and drops tenantId from the query', async () => {
    const fetchMock = mockFetch();
    await client().request('/assets', {
      params: { class: 'DEVICE', tenantId: 'should-not-leak' },
      tenantId: 'tenant-1',
      headers: { 'X-Trace': 'abc' },
    });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(headers['x-tenant-id']).toBe('tenant-1');
    expect(headers['X-Trace']).toBe('abc');
    expect(url.searchParams.get('class')).toBe('DEVICE');
    expect(url.searchParams.has('tenantId')).toBe(false);
  });

  it('sends a JSON body on writes and returns 204 as an empty object', async () => {
    const fetchMock = mockFetch(request => {
      expect(request.method).toBe('POST');
      expect(request.body).toBe('{"name":"Acme"}');
      return new Response(null, { status: 204 });
    });
    const created = await client().request('/accounts', { method: 'POST', body: { name: 'Acme' } });
    expect(created).toEqual({});
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('returns an empty object for a non-JSON success', async () => {
    mockFetch(() => new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } }));
    await expect(client().request('/accounts')).resolves.toEqual({});
  });

  it('throws when a JSON success body is not JSON', async () => {
    mockFetch(() => new Response('not-json', { status: 200, headers: { 'content-type': 'application/json' } }));
    await expect(client().request('/accounts')).rejects.toBeInstanceOf(ServiceError);
  });

  it('throws AuthenticationError, NotEntitledError, NotFoundError, and ServerError', async () => {
    mockFetch(() => jsonResponse({ message: 'nope' }, 401));
    await expect(client().request('/accounts')).rejects.toBeInstanceOf(AuthenticationError);

    mockFetch(() => jsonResponse(loadFixture('error-body.json'), 403));
    const forbidden = await client().request('/vulnerabilities').catch(error => error);
    expect(forbidden).toBeInstanceOf(NotEntitledError);
    expect(forbidden.path).toBe('/v1/vulnerabilities');
    expect(forbidden.status).toBe(403);
    expect(JSON.stringify(forbidden)).not.toContain(TOKEN);
    expect(JSON.stringify(forbidden)).toContain('x-tenant-id header is required');

    mockFetch(() => new Response('upstream said no', { status: 404, headers: { 'content-type': 'text/plain' } }));
    const textError = await client().request('/vm-darkweb').catch(error => error) as NotFoundError;
    expect(textError).toBeInstanceOf(NotFoundError);
    expect(textError.body).toBe('upstream said no');
    expect(textError.status).toBe(404);

    mockFetch(() => new Response(null, { status: 404 }));
    const empty = await client().request('/missing').catch(error => error) as NotFoundError;
    expect(empty.body).toBeNull();
    expect(empty.message.length).toBeGreaterThan(0);
    const missing = await client().request('/vm-darkweb', { pathNote: 'Unconfirmed path.' }).catch(error => error);
    expect(missing).toBeInstanceOf(NotFoundError);
    expect(missing.message).toContain('Unconfirmed path.');
    expect(missing.path).toBe('/v1/vm-darkweb');

    mockFetch(() => jsonResponse({ message: 'boom' }, 500));
    await expect(client().request('/accounts')).rejects.toBeInstanceOf(ServerError);

    mockFetch(() => jsonResponse({ detail: 12 }, 418));
    const other = await client().request('/accounts').catch(error => error);
    expect(other).toBeInstanceOf(ServiceError);
    expect(other.status).toBe(418);
  });

  it('maps object and array validation errors', async () => {
    mockFetch(() => jsonResponse({ message: 'bad', errors: { class: 'invalid' } }, 400));
    const objectError = await client().request('/assets').catch(error => error) as ValidationError;
    expect(objectError).toBeInstanceOf(ValidationError);
    expect(objectError.errors).toEqual([{ field: 'class', message: 'invalid' }]);

    mockFetch(() => jsonResponse({
      message: 'bad',
      errors: [{ field: 'class', message: 'required' }],
    }, 400));
    const arrayError = await client().request('/assets').catch(error => error) as ValidationError;
    expect(arrayError.errors).toEqual([{ field: 'class', message: 'required' }]);

    mockFetch(() => jsonResponse({ message: 5 }, 400));
    const plain = await client().request('/assets').catch(error => error) as ValidationError;
    expect(plain.errors).toEqual([]);
  });

  it('retries once when Retry-After is set, then surfaces RateLimitError', async () => {
    vi.useFakeTimers();
    let calls = 0;
    mockFetch(() => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({ message: 'slow' }, 429, { 'Retry-After': '1' });
      }
      return jsonResponse({ data: [{ id: 'a1' }], meta: { currentPage: 1, totalItems: 1, pageSize: 1, totalPages: 1 } });
    });
    const pending = client().request('/accounts');
    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).resolves.toMatchObject({ data: [{ id: 'a1' }] });
    expect(calls).toBe(2);
  });

  it('does not retry when Retry-After is zero or the header is not numeric', async () => {
    mockFetch(() => jsonResponse({ message: 'slow' }, 429, { 'Retry-After': '0' }));
    const limited = await client().request('/accounts').catch(error => error) as RateLimitError;
    expect(limited).toBeInstanceOf(RateLimitError);
    expect(limited.retryAfter).toBe(0);
    expect(limited.path).toBe('/v1/accounts');

    mockFetch(() => jsonResponse('plain slow', 429, { 'Retry-After': 'soon' }));
    const again = await client().request('/accounts').catch(error => error) as RateLimitError;
    expect(again.retryAfter).toBe(60);
    expect(again.message).toContain('plain slow');
  });

  it('wraps timeouts and rethrows network failures', async () => {
    mockFetch(() => Promise.reject(Object.assign(new Error('aborted'), { name: 'TimeoutError' })));
    const timeout = await client().request('/accounts').catch(error => error) as ServiceError;
    expect(timeout).toBeInstanceOf(ServiceError);
    expect(timeout.status).toBe(408);
    expect(timeout.path).toBe('/v1/accounts');

    mockFetch(() => Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    await expect(client().request('/accounts')).rejects.toMatchObject({ status: 408 });

    const network = new Error('ECONNRESET');
    mockFetch(() => Promise.reject(network));
    await expect(client().request('/accounts')).rejects.toBe(network);
  });
});
