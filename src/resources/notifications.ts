import { HttpClient } from '../http.js';
import { PaginatedResponse } from '../pagination.js';
import type { NotificationChannel, NotificationChannelListParams } from '../types/notifications.js';

export class NotificationsResource {
  constructor(private readonly httpClient: HttpClient) {}

  async listChannels(params?: NotificationChannelListParams): Promise<PaginatedResponse<NotificationChannel>> {
    return this.httpClient.request<PaginatedResponse<NotificationChannel>>('/notifications', {
      ...(params ? { params } : {}),
    });
  }

  async getChannel(id: string): Promise<NotificationChannel> {
    return this.httpClient.request<NotificationChannel>(`/notifications/${encodeURIComponent(id)}`);
  }
}
