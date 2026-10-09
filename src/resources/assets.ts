import { HttpClient } from '../http.js';
import { ValidationError } from '../errors.js';
import { PaginatedResponse } from '../pagination.js';
import {
  ASSET_CLASSES,
  RELATIONSHIP_ENTITY_CLASSES,
  type Asset,
  type AssetGetParams,
  type AssetListParams,
  type AssetRelationship,
  type AssetRelationshipDirection,
  type AssetRelationshipListParams,
} from '../types/assets.js';

const ASSET_CLASS_SET = new Set<string>(ASSET_CLASSES);
const RELATIONSHIP_CLASS_SET = new Set<string>(RELATIONSHIP_ENTITY_CLASSES);
const DIRECTIONS = new Set<string>(['in', 'out']);

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

function formatClassList(
  value: unknown,
  allowed: Set<string>,
  documented: readonly string[],
  path: string
): string {
  const classes = Array.isArray(value) ? value : [value];
  if (
    value === undefined ||
    value === null ||
    classes.length === 0 ||
    classes.some(item => typeof item !== 'string' || item.length === 0 || !allowed.has(item))
  ) {
    throw new ValidationError(
      `class is required. Valid values: ${documented.join(', ')}`,
      [{ field: 'class', message: `Expected one of ${documented.join(', ')}` }],
      { documented },
      path
    );
  }
  return classes.join(',');
}

export class AssetsResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * List assets. CompassOne rejects the call without `class` (for example `DEVICE`)
   * and without the `x-tenant-id` header.
   */
  async list(params: AssetListParams): Promise<PaginatedResponse<Asset>> {
    const path = '/assets';
    const source = params ?? ({} as AssetListParams);
    const tenantId = requireTenantId(source.tenantId, path);
    const classValue = formatClassList(source.class, ASSET_CLASS_SET, ASSET_CLASSES, path);
    const query: Record<string, unknown> = { ...source };
    delete query.tenantId;
    delete query.class;
    return this.httpClient.request<PaginatedResponse<Asset>>(path, {
      params: { ...query, class: classValue },
      tenantId,
    });
  }

  async get(id: string, params: AssetGetParams): Promise<Asset> {
    const path = `/assets/${encodeURIComponent(id)}`;
    const tenantId = requireTenantId(params?.tenantId, path);
    return this.httpClient.request<Asset>(path, { tenantId });
  }

  /**
   * Relationships for one asset. `class` is the far-side entity class (`entityClass`
   * on the wire) and `direction` is `in` or `out`. Both are required, as is `x-tenant-id`.
   */
  async listRelationships(
    assetId: string,
    params: AssetRelationshipListParams
  ): Promise<PaginatedResponse<AssetRelationship>> {
    const path = `/assets/${encodeURIComponent(assetId)}/relationships`;
    const tenantId = requireTenantId(params?.tenantId, path);
    const source = params ?? ({} as AssetRelationshipListParams);
    const entityClass = formatClassList(
      source.class,
      RELATIONSHIP_CLASS_SET,
      RELATIONSHIP_ENTITY_CLASSES,
      path
    );
    const direction = source.direction;
    if (!direction || !DIRECTIONS.has(direction)) {
      throw new ValidationError(
        'direction is required and must be "in" or "out"',
        [{ field: 'direction', message: 'Expected "in" or "out"' }],
        null,
        path
      );
    }
    const query: Record<string, unknown> = { ...source };
    delete query.tenantId;
    delete query.class;
    delete query.direction;
    return this.httpClient.request<PaginatedResponse<AssetRelationship>>(path, {
      params: {
        ...query,
        entityClass,
        direction: direction as AssetRelationshipDirection,
      },
      tenantId,
    });
  }
}
