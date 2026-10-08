import { HttpClient } from '../http.js';
import { ValidationError } from '../errors.js';
import { PaginatedResponse } from '../pagination.js';
import type { ContactGroup, ContactGroupGetParams, ContactGroupListParams } from '../types/contact-groups.js';

export class ContactGroupsResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * `GET /accounts/{accountId}/contact-groups`.
   * The flat `/contact-groups` path returns 404 (confirmed 2026-10-07; published OpenAPI).
   */
  async list(params: ContactGroupListParams): Promise<PaginatedResponse<ContactGroup>> {
    const accountId = params?.accountId;
    const path = '/accounts/{accountId}/contact-groups';
    if (!accountId) {
      throw new ValidationError(
        'accountId is required',
        [{ field: 'accountId', message: 'Contact groups are listed under /accounts/{accountId}/contact-groups' }],
        null,
        path
      );
    }
    const query: Record<string, unknown> = { ...params };
    delete query.accountId;
    return this.httpClient.request<PaginatedResponse<ContactGroup>>(
      `/accounts/${encodeURIComponent(accountId)}/contact-groups`,
      { params: query }
    );
  }

  /**
   * One contact group: `GET /accounts/{accountId}/contact-groups/{id}`.
   *
   * @param id Contact group id.
   * @param params Account scope. `accountId` is required.
   * @throws {ValidationError} When `params.accountId` is missing or empty.
   *   No request is sent.
   */
  async get(id: string, params: ContactGroupGetParams): Promise<ContactGroup> {
    const accountId = params?.accountId;
    const path = `/accounts/{accountId}/contact-groups/${id}`;
    if (!accountId) {
      throw new ValidationError(
        'accountId is required',
        [{ field: 'accountId', message: 'Contact groups are addressed under /accounts/{accountId}/contact-groups/{id}' }],
        null,
        path
      );
    }
    return this.httpClient.request<ContactGroup>(
      `/accounts/${encodeURIComponent(accountId)}/contact-groups/${encodeURIComponent(id)}`
    );
  }
}
