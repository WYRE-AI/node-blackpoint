import { HttpClient } from '../http.js';
import { PaginatedResponse } from '../pagination.js';
import type {
  Vulnerability,
  VulnerabilityScan,
  DarkWebExposure,
  ExternalExposure,
  VulnerabilityListParams,
  ScanListParams,
  ExposureListParams,
} from '../types/vulnerabilities.js';

/**
 * Live probe 2026-10-07: `GET /vm-darkweb` is 404. compassone-sdk 0.0.60 (the
 * published CompassOne OpenAPI client) has no dark-web operation. A connector
 * describes "exposures from the most recent dark-web scan" but does not publish
 * the HTTP path. Calls still hit the legacy path and throw NotFoundError (404)
 * or NotEntitledError (403) with status, path, and the response body.
 */
export const DARK_WEB_PATH_NOTE =
  'Unconfirmed CompassOne path: /vm-darkweb returned 404 on 2026-10-07 and is absent from the published OpenAPI (compassone-sdk 0.0.60). No replacement HTTP path could be confirmed.';

/**
 * `GET /vm-external` was not in the 2026-10-07 probe and is not in compassone-sdk 0.0.60.
 * External findings are described per scan (scan type `external`) without a list path.
 */
export const EXTERNAL_EXPOSURE_PATH_NOTE =
  'Unconfirmed CompassOne path: /vm-external is not in the published OpenAPI (compassone-sdk 0.0.60) and was not confirmed against the live API. No replacement HTTP path could be confirmed.';

function splitTenant(params?: { tenantId?: string; [key: string]: unknown }): {
  tenantId?: string;
  query?: Record<string, unknown>;
} {
  if (!params) {
    return {};
  }
  const { tenantId, ...query } = params;
  return {
    ...(typeof tenantId === 'string' && tenantId.length > 0 ? { tenantId } : {}),
    query,
  };
}

export class VulnerabilitiesResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * `GET /vulnerabilities`. Confirmed on 2026-10-07: the path exists and returns
   * 403 for an account that is not entitled (thrown as {@link NotEntitledError}).
   * The previous `/vm-vulnerabilities` path returns 404.
   * `tenantId`, when set, is sent as `x-tenant-id`.
   */
  async listVulnerabilities(params?: VulnerabilityListParams): Promise<PaginatedResponse<Vulnerability>> {
    const { tenantId, query } = splitTenant(params);
    return this.httpClient.request<PaginatedResponse<Vulnerability>>('/vulnerabilities', {
      ...(query ? { params: query } : {}),
      ...(tenantId ? { tenantId } : {}),
    });
  }

  /** `GET /vulnerabilities/{id}`, following the confirmed collection path. */
  async getVulnerability(id: string, params?: { tenantId?: string }): Promise<Vulnerability> {
    return this.httpClient.request<Vulnerability>(`/vulnerabilities/${encodeURIComponent(id)}`, {
      ...(params?.tenantId ? { tenantId: params.tenantId } : {}),
    });
  }

  /**
   * `GET /scans`. Confirmed on 2026-10-07: the path exists and returns 403 when
   * the account is not entitled.
   */
  async listScans(params?: ScanListParams): Promise<PaginatedResponse<VulnerabilityScan>> {
    const { tenantId, query } = splitTenant(params);
    return this.httpClient.request<PaginatedResponse<VulnerabilityScan>>('/scans', {
      ...(query ? { params: query } : {}),
      ...(tenantId ? { tenantId } : {}),
    });
  }

  /** `GET /scans/{id}`, following the confirmed collection path. */
  async getScan(id: string, params?: { tenantId?: string }): Promise<VulnerabilityScan> {
    return this.httpClient.request<VulnerabilityScan>(`/scans/${encodeURIComponent(id)}`, {
      ...(params?.tenantId ? { tenantId: params.tenantId } : {}),
    });
  }

  /**
   * UNCONFIRMED. See {@link DARK_WEB_PATH_NOTE}. A 404 is {@link NotFoundError}
   * and a 403 is {@link NotEntitledError}; both include status, path, and body.
   */
  async listDarkWebExposures(params?: ExposureListParams): Promise<PaginatedResponse<DarkWebExposure>> {
    const { tenantId, query } = splitTenant(params);
    return this.httpClient.request<PaginatedResponse<DarkWebExposure>>('/vm-darkweb', {
      ...(query ? { params: query } : {}),
      ...(tenantId ? { tenantId } : {}),
      pathNote: DARK_WEB_PATH_NOTE,
    });
  }

  /** UNCONFIRMED. See {@link DARK_WEB_PATH_NOTE}. */
  async getDarkWebExposure(id: string, params?: { tenantId?: string }): Promise<DarkWebExposure> {
    const path = `/vm-darkweb/${encodeURIComponent(id)}`;
    return this.httpClient.request<DarkWebExposure>(path, {
      ...(params?.tenantId ? { tenantId: params.tenantId } : {}),
      pathNote: DARK_WEB_PATH_NOTE,
    });
  }

  /** UNCONFIRMED. See {@link EXTERNAL_EXPOSURE_PATH_NOTE}. */
  async listExternalExposures(params?: ExposureListParams): Promise<PaginatedResponse<ExternalExposure>> {
    const { tenantId, query } = splitTenant(params);
    return this.httpClient.request<PaginatedResponse<ExternalExposure>>('/vm-external', {
      ...(query ? { params: query } : {}),
      ...(tenantId ? { tenantId } : {}),
      pathNote: EXTERNAL_EXPOSURE_PATH_NOTE,
    });
  }

  /** UNCONFIRMED. See {@link EXTERNAL_EXPOSURE_PATH_NOTE}. */
  async getExternalExposure(id: string, params?: { tenantId?: string }): Promise<ExternalExposure> {
    return this.httpClient.request<ExternalExposure>(`/vm-external/${encodeURIComponent(id)}`, {
      ...(params?.tenantId ? { tenantId: params.tenantId } : {}),
      pathNote: EXTERNAL_EXPOSURE_PATH_NOTE,
    });
  }
}
