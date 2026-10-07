import { HttpClient } from '../http.js';
import { ValidationError } from '../errors.js';
import { PaginatedResponse } from '../pagination.js';
import type {
  AlertGroup,
  AlertGroupGetParams,
  AlertGroupListParams,
} from '../types/alert-groups.js';

function requireTenantId(tenantId: string | undefined, path: string): string {
  if (!tenantId) {
    throw new ValidationError(
      'x-tenant-id header is required',
      [{ field: 'tenantId', message: 'Pass tenantId; it is sent as the x-tenant-id header' }],
      null,
      path
    );
  }
  return tenantId;
}

function formatStatus(status: AlertGroupListParams['status']): string | undefined {
  if (status === undefined) {
    return undefined;
  }
  return Array.isArray(status) ? status.join(',') : status;
}

export class AlertGroupsResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * List alert groups (`GET /alert-groups`). Paged with `skip` and `take`.
   * `tenantId` is required and is sent as `x-tenant-id`.
   */
  async list(params: AlertGroupListParams): Promise<PaginatedResponse<AlertGroup>> {
    const path = '/alert-groups';
    const source = params ?? ({} as AlertGroupListParams);
    const tenantId = requireTenantId(source.tenantId, path);
    const statusValue = formatStatus(source.status);
    const query: Record<string, unknown> = { ...source };
    delete query.tenantId;
    delete query.status;
    return this.httpClient.request<PaginatedResponse<AlertGroup>>(path, {
      params: {
        ...query,
        ...(statusValue !== undefined ? { status: statusValue } : {}),
      },
      tenantId,
    });
  }

  async get(id: string, params: AlertGroupGetParams): Promise<AlertGroup> {
    const path = `/alert-groups/${encodeURIComponent(id)}`;
    const tenantId = requireTenantId(params?.tenantId, path);
    return this.httpClient.request<AlertGroup>(path, { tenantId });
  }
}
