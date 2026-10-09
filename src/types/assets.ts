import type { BaseEntity, ListParams } from './common.js';

/**
 * Asset classes documented for CompassOne inventory list.
 * Source: CompassOne asset-list contract (class filter is required).
 * `CLOUD` is not in that enum.
 */
export const ASSET_CLASSES = [
  'CONTAINER',
  'DEVICE',
  'FRAMEWORK',
  'NETSTAT',
  'PERSON',
  'PROCESS',
  'SERVICE',
  'SOFTWARE',
  'SOURCE',
  'SURVEY',
  'USER',
] as const;

export type AssetClass = (typeof ASSET_CLASSES)[number];

/**
 * Far-side classes accepted by the asset relationship read.
 * Includes finding types that are not valid on the asset list itself.
 */
export const RELATIONSHIP_ENTITY_CLASSES = [
  ...ASSET_CLASSES,
  'ALERT',
  'ALERTGROUP',
  'EVENT',
  'INCIDENT',
  'VULNERABILITY',
] as const;

export type RelationshipEntityClass = (typeof RELATIONSHIP_ENTITY_CLASSES)[number];

/** `out` = this asset points at the entity. `in` = the entity points at this asset. */
export type AssetRelationshipDirection = 'in' | 'out';

export type AssetStatus = 'active' | 'inactive' | 'decommissioned';

export interface Asset extends BaseEntity {
  accountId: string;
  tenantId: string;
  assetClass: AssetClass | string;
  classification?: string;
  criticality?: string;
  description?: string;
  displayName: string;
  name: string;
  status: AssetStatus;
  summary?: string;
  type?: string;
  foundBy?: string;
  foundOn?: string;
  lastSeenOn?: string;
  agentLastSeenOn?: string;
  agentDeactivatedOn?: string;
  lastLoginOn?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  deletedOn?: string;
}

export interface AssetListParams extends ListParams {
  /** Required. Sent as the repeated-or-comma `class` query parameter. */
  class: AssetClass | AssetClass[];
  /** Required. Sent as the `x-tenant-id` header, not as a query parameter. */
  tenantId: string;
  withDeleted?: boolean;
  sources?: string[];
  platform?: string[];
  type?: string[];
  foundOn?: string[];
  lastSeenOn?: string[];
  decommissioned?: string[];
  wdStatus?: string[];
  filter?: string;
  sortBy?:
    | 'accountId'
    | 'assetClass'
    | 'classification'
    | 'createdBy'
    | 'createdOn'
    | 'criticality'
    | 'deletedBy'
    | 'deletedOn'
    | 'description'
    | 'displayName'
    | 'foundBy'
    | 'foundOn'
    | 'id'
    | 'lastSeenOn'
    | 'name'
    | 'status'
    | 'summary'
    | 'tenantId'
    | 'type'
    | 'updatedBy'
    | 'updatedOn'
    | 'agentLastSeenOn'
    | 'agentDeactivatedOn'
    | 'lastLoginOn';
}

export interface AssetGetParams {
  tenantId: string;
}

export interface AssetRelationship extends BaseEntity {
  sourceAssetId: string;
  targetAssetId: string;
  relationshipType: string;
  direction: AssetRelationshipDirection;
}

export interface AssetRelationshipListParams extends ListParams {
  class: RelationshipEntityClass;
  direction: AssetRelationshipDirection;
  tenantId: string;
  withDeleted?: boolean;
  sortBy?: 'createdOn' | 'created_on';
}
