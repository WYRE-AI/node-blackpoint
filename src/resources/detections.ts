import { PaginatedResponse } from '../pagination.js';
import type { AlertGroupGetParams, AlertGroupListParams, AlertGroupStatus } from '../types/alert-groups.js';
import type { Detection, DetectionListParams } from '../types/detections.js';
import { AlertGroupsResource } from './alert-groups.js';

function mapLegacyStatus(status: DetectionListParams['status']): AlertGroupListParams['status'] {
  if (!status) {
    return undefined;
  }
  const values = Array.isArray(status) ? status : [status];
  const mapped = new Set<AlertGroupStatus>();
  for (const value of values) {
    const text = String(value).toUpperCase();
    if (text === 'OPEN' || text === 'NEW' || text === 'INVESTIGATING') {
      mapped.add('OPEN');
    } else if (text === 'RESOLVED') {
      mapped.add('RESOLVED');
    }
  }
  if (mapped.size === 0) {
    return undefined;
  }
  if (mapped.size === 1) {
    const only = [...mapped][0];
    return only ?? undefined;
  }
  return [...mapped];
}

function toAlertGroupParams(params?: DetectionListParams): AlertGroupListParams {
  const take = params?.take ?? params?.pageSize;
  const skip = params?.skip ?? (
    params?.page !== undefined ? Math.max(0, params.page - 1) * (take ?? 100) : undefined
  );
  const status = mapLegacyStatus(params?.status);
  return {
    tenantId: params?.tenantId ?? '',
    ...(skip !== undefined ? { skip } : {}),
    ...(take !== undefined ? { take } : {}),
    ...(params?.fromDate ? { since: params.fromDate } : {}),
    ...(params?.search ? { search: String(params.search) } : {}),
    ...(status !== undefined ? { status } : {}),
  };
}

/**
 * @deprecated `GET /detections` returns 404. This type forwards to
 * {@link AlertGroupsResource}. Prefer `client.alertGroups`.
 */
export class DetectionsResource {
  constructor(private readonly alertGroups: AlertGroupsResource) {}

  /**
   * @deprecated Use `client.alertGroups.list`. Page/pageSize are converted to skip/take.
   */
  async list(params?: DetectionListParams): Promise<PaginatedResponse<Detection>> {
    const page = await this.alertGroups.list(toAlertGroupParams(params));
    return page as PaginatedResponse<Detection>;
  }

  /**
   * @deprecated Use `client.alertGroups.get`. `tenantId` is required (`x-tenant-id`).
   */
  async get(id: string, params: AlertGroupGetParams): Promise<Detection> {
    const group = await this.alertGroups.get(id, params);
    return group as Detection;
  }
}
