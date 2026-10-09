import { ValidationError } from '../errors.js';
import { PaginatedResponse } from '../pagination.js';
import type { AlertGroupGetParams, AlertGroupListParams, AlertGroupStatus } from '../types/alert-groups.js';
import type { Detection, DetectionListParams } from '../types/detections.js';
import { AlertGroupsResource } from './alert-groups.js';

const DETECTIONS_PATH = '/detections';

/**
 * Legacy filters alert groups cannot express. Dropping one would widen the
 * result set past what the caller asked for, so the alias rejects them.
 */
const UNSUPPORTED_LEGACY_FILTERS = ['assetId', 'severity', 'ruleId', 'source', 'toDate'] as const;

function rejectUnsupportedFilters(params?: DetectionListParams): void {
  if (!params) {
    return;
  }
  const present = UNSUPPORTED_LEGACY_FILTERS.filter((key) => {
    const value = params[key];
    return value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0) && value !== '';
  });
  if (present.length > 0) {
    throw new ValidationError(
      `detections.list cannot apply ${present.join(', ')}; alert groups have no equivalent filter`,
      present.map((field) => ({
        field,
        message: 'Not supported by GET /alert-groups. Use client.alertGroups.list and filter the results.',
      })),
      null,
      DETECTIONS_PATH
    );
  }
}

function mapLegacyStatus(status: DetectionListParams['status']): AlertGroupListParams['status'] {
  if (!status) {
    return undefined;
  }
  const values = Array.isArray(status) ? status : [status];
  if (values.length === 0) {
    return undefined;
  }
  const mapped = new Set<AlertGroupStatus>();
  const unsupported: string[] = [];
  for (const value of values) {
    const text = String(value).toUpperCase();
    if (text === 'OPEN' || text === 'NEW' || text === 'INVESTIGATING') {
      mapped.add('OPEN');
    } else if (text === 'RESOLVED') {
      mapped.add('RESOLVED');
    } else {
      unsupported.push(String(value));
    }
  }
  if (mapped.size === 0) {
    // e.g. only `false_positive`: sending no status filter would return every
    // alert group, not the requested subset.
    throw new ValidationError(
      `detections.list cannot filter by status ${unsupported.join(', ')}; alert groups support OPEN and RESOLVED only`,
      [{ field: 'status', message: 'Use new, investigating, open, or resolved.' }],
      null,
      DETECTIONS_PATH
    );
  }
  if (mapped.size === 1) {
    const only = [...mapped][0];
    return only ?? undefined;
  }
  return [...mapped];
}

function toAlertGroupParams(params?: DetectionListParams): AlertGroupListParams {
  rejectUnsupportedFilters(params);
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
