import type { BaseEntity } from './common.js';

export type AlertGroupStatus = 'OPEN' | 'RESOLVED';
export type AlertGroupType = 'CR' | 'MDR';

export type AlertGroupSortColumn =
  | 'alertCount'
  | 'alertTypes'
  | 'created'
  | 'hostname'
  | 'status'
  | 'username';

/**
 * An alert group is the SOC unit of triage. CompassOne removed `GET /detections`;
 * groups are listed at `GET /alert-groups` and paged with `skip` / `take`.
 */
export interface AlertGroup extends BaseEntity {
  tenantId?: string;
  status?: AlertGroupStatus | string;
  alertCount?: number;
  alertTypes?: string[];
  hostname?: string;
  username?: string;
  type?: AlertGroupType | string;
  details?: Record<string, unknown>;
}

export interface AlertGroupListParams {
  /** Required. Sent as the `x-tenant-id` header. */
  tenantId: string;
  skip?: number;
  take?: number;
  search?: string;
  /** ISO-8601 instant. CompassOne allows at most 90 days back. */
  since?: string;
  status?: AlertGroupStatus | AlertGroupStatus[];
  type?: AlertGroupType;
  sortByColumn?: AlertGroupSortColumn;
  sortDirection?: 'ASC' | 'DESC';
  minAlertsCount?: number;
  maxAlertsCount?: number;
  tunnelSearch?: string;
}

export interface AlertGroupGetParams {
  tenantId: string;
}
