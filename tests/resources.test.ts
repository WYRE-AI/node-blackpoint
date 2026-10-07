import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompassOneClient } from '../src/client.js';
import {
  NotEntitledError,
  NotFoundError,
  ValidationError,
} from '../src/errors.js';
import { ASSET_CLASSES } from '../src/types/assets.js';
import { DARK_WEB_PATH_NOTE, EXTERNAL_EXPOSURE_PATH_NOTE } from '../src/resources/vulnerabilities.js';
import { header, jsonResponse, loadFixture, mockFetch, parsedUrl, type CapturedRequest } from './helpers.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

function client(): CompassOneClient {
  return new CompassOneClient({ apiToken: 'msp-key' });
}

function lastRequest(fetchMock: ReturnType<typeof vi.fn>): CapturedRequest {
  const call = fetchMock.mock.calls.at(-1);
  const init = call?.[1] as RequestInit | undefined;
  const headers = (init?.headers ?? {}) as Record<string, string>;
  return {
    url: String(call?.[0]),
    method: init?.method ?? 'GET',
    headers,
  };
}

describe('CompassOneClient resources', () => {
  it('requires a token', () => {
    expect(() => new CompassOneClient({ apiToken: '' })).toThrow(/API token is required/);
  });

  it('lists accounts, tenants, users, collections, and notifications without a trailing slash', async () => {
    const fetchMock = mockFetch(request => {
      if (request.url.includes('/tenants')) {
        return jsonResponse(loadFixture('tenants-page.json'));
      }
      return jsonResponse({ id: 'one', name: 'Acme' });
    });
    const api = client();
    const tenants = await api.tenants.list({ accountId: 'acct-1' });
    expect(tenants.pagination?.totalCount).toBe(3);
    await api.tenants.get('tenant/1');
    await api.accounts.list({ page: 1 });
    await api.accounts.get('acct-1', { includeBranding: true });
    await api.users.list({ tenantId: 'tenant-1' });
    await api.users.get('user-1');
    await api.collections.list();
    await api.collections.get('col-1');
    await api.notifications.listChannels();
    await api.notifications.getChannel('chan-1');

    const paths = fetchMock.mock.calls.map(call => new URL(String(call[0])).pathname);
    expect(paths).toEqual([
      '/v1/tenants',
      '/v1/tenants/tenant%2F1',
      '/v1/accounts',
      '/v1/accounts/acct-1',
      '/v1/users',
      '/v1/users/user-1',
      '/v1/collections',
      '/v1/collections/col-1',
      '/v1/notifications',
      '/v1/notifications/chan-1',
    ]);
    const userCall = fetchMock.mock.calls[4];
    const userUrl = new URL(String(userCall?.[0]));
    expect(userUrl.searchParams.get('tenantId')).toBe('tenant-1');
    const userHeaders = (userCall?.[1] as RequestInit).headers as Record<string, string>;
    expect(userHeaders['x-tenant-id']).toBeUndefined();
  });

  it('requires a documented asset class and sends it with x-tenant-id', async () => {
    const fetchMock = mockFetch(() => jsonResponse({
      data: [{ id: 'asset-1', displayName: 'laptop', name: 'laptop', assetClass: 'DEVICE', status: 'active', accountId: 'a', tenantId: 't' }],
      meta: { currentPage: 1, totalItems: 1, pageSize: 50, totalPages: 1 },
    }));
    const api = client();

    await expect(api.assets.list({ class: 'endpoint' as 'DEVICE', tenantId: 't' })).rejects.toBeInstanceOf(ValidationError);
    await expect(api.assets.list({ tenantId: 't' } as never)).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();

    const page = await api.assets.list({
      class: ['DEVICE', 'USER'],
      tenantId: 'tenant-1',
      sources: ['agent'],
    });
    expect(page.pagination?.hasNext).toBe(false);
    const listed = lastRequest(fetchMock);
    const listedUrl = parsedUrl(listed);
    expect(listedUrl.pathname).toBe('/v1/assets');
    expect(listedUrl.searchParams.get('class')).toBe('DEVICE,USER');
    expect(listedUrl.searchParams.getAll('sources')).toEqual(['agent']);
    expect(listedUrl.searchParams.has('tenantId')).toBe(false);
    expect(header(listed, 'x-tenant-id')).toBe('tenant-1');
    expect(ASSET_CLASSES).toContain('DEVICE');
    expect(ASSET_CLASSES).not.toContain('CLOUD' as never);

    await api.assets.get('asset 1', { tenantId: 'tenant-1' });
    const got = lastRequest(fetchMock);
    expect(parsedUrl(got).pathname).toBe('/v1/assets/asset%201');
    expect(header(got, 'x-tenant-id')).toBe('tenant-1');

    await expect(api.assets.get('asset-1', { tenantId: '' })).rejects.toBeInstanceOf(ValidationError);
    await expect(api.assets.listRelationships('asset-1', {
      class: 'DEVICE',
      direction: 'parent' as 'out',
      tenantId: 'tenant-1',
    })).rejects.toBeInstanceOf(ValidationError);

    await api.assets.listRelationships('asset-1', {
      class: 'VULNERABILITY',
      direction: 'out',
      tenantId: 'tenant-1',
    });
    const rel = lastRequest(fetchMock);
    const relUrl = parsedUrl(rel);
    expect(relUrl.pathname).toBe('/v1/assets/asset-1/relationships');
    expect(relUrl.searchParams.get('entityClass')).toBe('VULNERABILITY');
    expect(relUrl.searchParams.get('direction')).toBe('out');
    expect(header(rel, 'x-tenant-id')).toBe('tenant-1');
  });

  it('lists alert groups with skip/take and keeps a detections alias', async () => {
    const fetchMock = mockFetch(() => jsonResponse(loadFixture('alert-groups-page.json')));
    const api = client();

    await expect(api.alertGroups.list({ tenantId: '' })).rejects.toBeInstanceOf(ValidationError);

    const page = await api.alertGroups.list({
      tenantId: 'tenant-1',
      skip: 0,
      take: 50,
      status: ['OPEN', 'RESOLVED'],
    });
    expect(page.pagination).toMatchObject({ skip: 0, take: 50, totalCount: 80, hasNext: true });
    const listed = lastRequest(fetchMock);
    const listedUrl = parsedUrl(listed);
    expect(listedUrl.pathname).toBe('/v1/alert-groups');
    expect(listedUrl.searchParams.get('skip')).toBe('0');
    expect(listedUrl.searchParams.get('take')).toBe('50');
    expect(listedUrl.searchParams.get('status')).toBe('OPEN,RESOLVED');
    expect(header(listed, 'x-tenant-id')).toBe('tenant-1');

    await api.alertGroups.get('ag/1', { tenantId: 'tenant-1' });
    expect(parsedUrl(lastRequest(fetchMock)).pathname).toBe('/v1/alert-groups/ag%2F1');

    await api.detections.list({
      tenantId: 'tenant-1',
      page: 2,
      pageSize: 25,
      status: ['new', 'resolved'],
      fromDate: '2026-09-01T00:00:00Z',
      search: 'host',
      severity: ['high'],
    });
    const aliased = parsedUrl(lastRequest(fetchMock));
    expect(aliased.pathname).toBe('/v1/alert-groups');
    expect(aliased.searchParams.get('skip')).toBe('25');
    expect(aliased.searchParams.get('take')).toBe('25');
    expect(aliased.searchParams.get('since')).toBe('2026-09-01T00:00:00Z');
    expect(aliased.searchParams.get('status')).toBe('OPEN,RESOLVED');
    expect(aliased.searchParams.has('severity')).toBe(false);

    await api.detections.list({ tenantId: 'tenant-1', page: 1 });
    expect(parsedUrl(lastRequest(fetchMock)).searchParams.get('skip')).toBe('0');
    expect(parsedUrl(lastRequest(fetchMock)).searchParams.has('status')).toBe(false);

    await api.detections.list({ tenantId: 'tenant-1', status: ['resolved'], skip: 5, take: 5 });
    expect(parsedUrl(lastRequest(fetchMock)).searchParams.get('status')).toBe('RESOLVED');
    expect(parsedUrl(lastRequest(fetchMock)).searchParams.get('skip')).toBe('5');

    await api.detections.list({ tenantId: 'tenant-1', status: ['false_positive'] });
    expect(parsedUrl(lastRequest(fetchMock)).searchParams.has('status')).toBe(false);

    await expect(api.detections.get('ag-1')).rejects.toBeInstanceOf(ValidationError);
    await api.detections.get('ag-1', { tenantId: 'tenant-1' });
    expect(header(lastRequest(fetchMock), 'x-tenant-id')).toBe('tenant-1');
  });

  it('calls confirmed vulnerability and scan paths and marks dark web as unconfirmed', async () => {
    const fetchMock = mockFetch(request => {
      if (request.url.includes('/vulnerabilities') || request.url.includes('/scans')) {
        return jsonResponse({ message: 'not entitled' }, 403);
      }
      return jsonResponse({ message: 'missing' }, 404);
    });
    const api = client();

    const vulns = await api.vulnerabilities.listVulnerabilities({ tenantId: 'tenant-1', severity: ['critical'] }).catch(error => error);
    expect(vulns).toBeInstanceOf(NotEntitledError);
    expect(vulns.path).toBe('/v1/vulnerabilities?severity=critical');
    expect(vulns.message).not.toContain('Unconfirmed');
    const vulnUrl = parsedUrl(lastRequest(fetchMock));
    expect(vulnUrl.pathname).toBe('/v1/vulnerabilities');
    expect(vulnUrl.searchParams.has('tenantId')).toBe(false);
    expect(header(lastRequest(fetchMock), 'x-tenant-id')).toBe('tenant-1');

    await expect(api.vulnerabilities.getVulnerability('cve-1', { tenantId: 'tenant-1' })).rejects.toBeInstanceOf(NotEntitledError);
    await expect(api.vulnerabilities.listScans()).rejects.toBeInstanceOf(NotEntitledError);
    expect(parsedUrl(lastRequest(fetchMock)).pathname).toBe('/v1/scans');
    await expect(api.vulnerabilities.getScan('scan-1')).rejects.toBeInstanceOf(NotEntitledError);

    const dark = await api.vulnerabilities.listDarkWebExposures({ tenantId: 'tenant-1' }).catch(error => error);
    expect(dark).toBeInstanceOf(NotFoundError);
    expect(dark.message).toContain(DARK_WEB_PATH_NOTE);
    expect(dark.path).toBe('/v1/vm-darkweb');
    expect(dark.status).toBe(404);
    expect(JSON.stringify(dark)).toContain('missing');

    await expect(api.vulnerabilities.getDarkWebExposure('exp-1')).rejects.toBeInstanceOf(NotFoundError);
    const external = await api.vulnerabilities.listExternalExposures().catch(error => error);
    expect(external.message).toContain(EXTERNAL_EXPOSURE_PATH_NOTE);
    await expect(api.vulnerabilities.getExternalExposure('ext-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('uses the published contact-group and cloud paths', async () => {
    const fetchMock = mockFetch(() => jsonResponse([
      { id: 'onb-1', tenantId: 'tenant-1', provider: 'google', status: 'active' },
    ]));
    const api = client();

    await expect(api.contactGroups.list({} as never)).rejects.toBeInstanceOf(ValidationError);
    await api.contactGroups.list({ accountId: 'acct-1', search: 'soc' });
    expect(parsedUrl(lastRequest(fetchMock)).pathname).toBe('/v1/accounts/acct-1/contact-groups');
    await expect(api.contactGroups.get('cg-1', { accountId: '' })).rejects.toBeInstanceOf(ValidationError);
    await api.contactGroups.get('cg-1', { accountId: 'acct-1' });
    expect(parsedUrl(lastRequest(fetchMock)).pathname).toBe('/v1/accounts/acct-1/contact-groups/cg-1');

    await expect(api.cloudMdr.listOnboardings()).rejects.toBeInstanceOf(NotFoundError);
    await expect(api.cloudMdr.getOnboarding('id')).rejects.toBeInstanceOf(NotFoundError);
    await expect(api.cloudMdr.listM365Onboardings()).rejects.toBeInstanceOf(NotFoundError);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await expect(api.cloudMdr.listGoogleOnboardings({})).rejects.toBeInstanceOf(ValidationError);
    const google = await api.cloudMdr.listGoogleOnboardings({ tenantId: 'tenant-1' });
    expect(google.data).toHaveLength(1);
    const googleReq = lastRequest(fetchMock);
    const googleUrl = parsedUrl(googleReq);
    expect(googleUrl.pathname).toBe('/v1/cloud/google/onboardings');
    expect(googleUrl.searchParams.get('tenantId')).toBe('tenant-1');
    expect(header(googleReq, 'x-tenant-id')).toBeUndefined();

    await expect(api.cloudMdr.listCiscoOnboardings({})).rejects.toBeInstanceOf(ValidationError);
    const ciscoMock = mockFetch(() => jsonResponse({
      data: [{ id: 'cisco-1', tenantId: 'tenant-1', provider: 'cisco', status: 'active' }],
      meta: { currentPage: 1, totalItems: 1, pageSize: 1, totalPages: 1 },
    }));
    const cisco = await api.cloudMdr.listCiscoOnboardings({ tenantId: 'tenant-1' });
    expect(cisco.pagination?.totalCount).toBe(1);
    expect(parsedUrl(lastRequest(ciscoMock)).pathname).toBe('/v1/cloud/cisco/onboardings');
  });
});
