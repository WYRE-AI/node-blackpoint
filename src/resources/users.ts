import { HttpClient } from '../http.js';
import { PaginatedResponse } from '../pagination.js';
import type { User, UserListParams } from '../types/users.js';

export class UsersResource {
  constructor(private readonly httpClient: HttpClient) {}

  /** `GET /users` exists (403 when the key is not entitled). */
  async list(params?: UserListParams): Promise<PaginatedResponse<User>> {
    return this.httpClient.request<PaginatedResponse<User>>('/users', {
      ...(params ? { params } : {}),
    });
  }

  async get(id: string): Promise<User> {
    return this.httpClient.request<User>(`/users/${encodeURIComponent(id)}`);
  }
}
