import type { ListParams } from './common.js';
import type { AlertGroup, AlertGroupStatus } from './alert-groups.js';

/**
 * @deprecated CompassOne no longer serves `GET /detections` (404 as of 2026-10-07).
 * Use {@link AlertGroup}. `client.detections` forwards to alert groups.
 */
export interface Detection extends AlertGroup {
  assetId?: string;
  ruleId?: string;
  ruleName?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  source?: string;
  timestamp?: string;
  mitreTactics?: string[];
  mitreTechniques?: string[];
}

/**
 * @deprecated Prefer {@link import('./alert-groups.js').AlertGroupListParams}.
 * `page` / `pageSize` are converted to `skip` / `take`. `fromDate` is sent as `since`.
 * Legacy status values `new` and `investigating` map to `OPEN`; `resolved` maps to `RESOLVED`.
 */
export interface DetectionListParams extends ListParams {
  tenantId?: string;
  assetId?: string;
  severity?: string[];
  status?: Array<'new' | 'investigating' | 'resolved' | 'false_positive' | AlertGroupStatus> | string[];
  ruleId?: string[];
  source?: string[];
  fromDate?: string;
  toDate?: string;
  skip?: number;
  take?: number;
}
