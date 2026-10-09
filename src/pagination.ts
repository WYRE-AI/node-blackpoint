export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  cursor?: string;
}

/** Page metadata returned by CompassOne as `meta`, not `pagination`. */
export interface PaginationMeta {
  currentPage?: number;
  totalItems?: number;
  pageSize?: number;
  totalPages?: number;
  skip?: number;
  take?: number;
  [key: string]: unknown;
}

export interface PaginationInfo {
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasNext?: boolean;
  skip?: number;
  take?: number;
  cursor?: string;
  nextCursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
  pagination?: PaginationInfo;
}

export function normalizePath(path: string): string {
  const collapsed = `/${path}`.replace(/\/+/g, '/');
  if (collapsed.length > 1 && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1);
  }
  return collapsed;
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/**
 * Copy `meta` onto `pagination` so callers that still read `pagination`
 * see `currentPage` / `totalItems` / `pageSize` / `totalPages`.
 * Skip/take metadata is copied through when that is what the route returns.
 */
export function applyPaginationMeta<T>(body: T): T {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }

  const record = body as Record<string, unknown>;
  const meta = record.meta;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return body;
  }

  const metaRecord = meta as Record<string, unknown>;
  const currentPage = asNumber(metaRecord.currentPage);
  const pageSize = asNumber(metaRecord.pageSize);
  const totalItems = asNumber(metaRecord.totalItems ?? metaRecord.total);
  const totalPages = asNumber(metaRecord.totalPages);
  const skip = asNumber(metaRecord.skip);
  const take = asNumber(metaRecord.take);

  const pagination: PaginationInfo = {};
  if (currentPage !== undefined) {
    pagination.page = currentPage;
  }
  if (pageSize !== undefined) {
    pagination.pageSize = pageSize;
  }
  if (totalItems !== undefined) {
    pagination.totalCount = totalItems;
  }
  if (totalPages !== undefined) {
    pagination.totalPages = totalPages;
  }
  if (currentPage !== undefined && totalPages !== undefined) {
    pagination.hasNext = currentPage < totalPages;
  } else if (skip !== undefined && take !== undefined && totalItems !== undefined) {
    pagination.hasNext = skip + take < totalItems;
  }
  if (skip !== undefined) {
    pagination.skip = skip;
  }
  if (take !== undefined) {
    pagination.take = take;
  }

  const existing = record.pagination;
  const merged = existing && typeof existing === 'object' && !Array.isArray(existing)
    ? { ...pagination, ...(existing as PaginationInfo) }
    : pagination;

  return {
    ...record,
    pagination: merged,
  } as T;
}
