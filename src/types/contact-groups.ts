import type { BaseEntity, ListParams } from './common.js';

export interface ContactGroupMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface ContactGroup extends BaseEntity {
  name: string;
  description?: string;
  tenantIds: string[];
  members: ContactGroupMember[];
  enabled: boolean;
}

/**
 * Contact groups are account-scoped: `GET /accounts/{accountId}/contact-groups`.
 * `GET /contact-groups` returns 404.
 */
export interface ContactGroupListParams extends ListParams {
  accountId: string;
  tenantId?: string;
  enabled?: boolean;
  sortBy?: 'id' | 'name' | 'created' | 'updated';
}

export interface ContactGroupGetParams {
  /**
   * Account that owns the contact group. Required: the route is
   * `/accounts/{accountId}/contact-groups/{id}`, and `contactGroups.get`
   * throws `ValidationError` (field `accountId`) before any request when it
   * is missing or empty.
   */
  accountId: string;
}
