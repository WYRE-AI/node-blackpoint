import { HttpClient } from '../http.js';
import { PaginatedResponse } from '../pagination.js';
import type { Collection, CollectionListParams } from '../types/collections.js';

export class CollectionsResource {
  constructor(private readonly httpClient: HttpClient) {}

  async list(params?: CollectionListParams): Promise<PaginatedResponse<Collection>> {
    return this.httpClient.request<PaginatedResponse<Collection>>('/collections', {
      ...(params ? { params } : {}),
    });
  }

  async get(id: string): Promise<Collection> {
    return this.httpClient.request<Collection>(`/collections/${encodeURIComponent(id)}`);
  }
}
