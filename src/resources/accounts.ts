import { HttpClient } from '../http.js';
import { PaginatedResponse } from '../pagination.js';
import type { Account, AccountListParams, AccountGetParams } from '../types/accounts.js';

export class AccountsResource {
  constructor(private readonly httpClient: HttpClient) {}

  async list(params?: AccountListParams): Promise<PaginatedResponse<Account>> {
    return this.httpClient.request<PaginatedResponse<Account>>('/accounts', {
      ...(params ? { params } : {}),
    });
  }

  async get(id: string, params?: AccountGetParams): Promise<Account> {
    return this.httpClient.request<Account>(`/accounts/${encodeURIComponent(id)}`, {
      ...(params ? { params } : {}),
    });
  }
}
