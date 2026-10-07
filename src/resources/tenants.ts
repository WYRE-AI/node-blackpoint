import { HttpClient } from '../http.js';
import { PaginatedResponse } from '../pagination.js';
import type { Tenant, TenantListParams } from '../types/tenants.js';

export class TenantsResource {
  constructor(private readonly httpClient: HttpClient) {}

  async list(params?: TenantListParams): Promise<PaginatedResponse<Tenant>> {
    return this.httpClient.request<PaginatedResponse<Tenant>>('/tenants', {
      ...(params ? { params } : {}),
    });
  }

  async get(id: string): Promise<Tenant> {
    return this.httpClient.request<Tenant>(`/tenants/${encodeURIComponent(id)}`);
  }
}
