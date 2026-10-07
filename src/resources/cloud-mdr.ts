import { HttpClient } from '../http.js';
import { NotFoundError, ValidationError } from '../errors.js';
import { PaginatedResponse } from '../pagination.js';
import type {
  CloudOnboarding,
  CloudOnboardingListParams,
  M365Onboarding,
  GoogleOnboarding,
  CiscoOnboarding,
} from '../types/cloud-mdr.js';

const REMOVED_CLOUD_MDR = {
  legacyPath: '/cloud-mdr',
  documentedPaths: [
    '/cloud/google/onboardings',
    '/cloud/cisco/onboardings',
    '/cloud/ms365/connections/{connectionId}',
  ],
};

function removedCloudMdr(operation: string): never {
  throw new NotFoundError(
    `${operation} called /cloud-mdr, which returned 404 on 2026-10-07 and is not in the published OpenAPI (compassone-sdk 0.0.60). Use the documented cloud paths instead.`,
    REMOVED_CLOUD_MDR,
    '/cloud-mdr'
  );
}

function asPage<T>(body: T[] | PaginatedResponse<T>): PaginatedResponse<T> {
  if (Array.isArray(body)) {
    return { data: body };
  }
  return body;
}

export class CloudMdrResource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Removed. `GET /cloud-mdr` is 404. Google and Cisco lists are separate methods;
   * Microsoft 365 is addressed by connection id under `/cloud/ms365/connections/{connectionId}`.
   */
  async listOnboardings(params?: CloudOnboardingListParams): Promise<PaginatedResponse<CloudOnboarding>> {
    void params;
    removedCloudMdr('listOnboardings');
  }

  /** Removed. There is no generic `/cloud-mdr/{id}` read in the published API. */
  async getOnboarding(id: string): Promise<CloudOnboarding> {
    void id;
    removedCloudMdr('getOnboarding');
  }

  /**
   * There is no list-all M365 onboardings route in the published API.
   * Connections are `GET /cloud/ms365/connections/{connectionId}`.
   */
  async listM365Onboardings(
    params?: CloudOnboardingListParams
  ): Promise<PaginatedResponse<M365Onboarding>> {
    void params;
    throw new NotFoundError(
      'listM365Onboardings called /cloud-mdr-m365, which is not a CompassOne path. Published M365 reads are /cloud/ms365/connections/{connectionId} and require a connection id.',
      {
        confirmed: false,
        legacyPath: '/cloud-mdr-m365',
        documentedPath: '/cloud/ms365/connections/{connectionId}',
      },
      '/cloud-mdr-m365'
    );
  }

  /**
   * `GET /cloud/google/onboardings?tenantId=`. Tenant id stays a query parameter
   * (published OpenAPI). It is not the `x-tenant-id` header.
   */
  async listGoogleOnboardings(
    params: CloudOnboardingListParams
  ): Promise<PaginatedResponse<GoogleOnboarding>> {
    const path = '/cloud/google/onboardings';
    if (!params?.tenantId) {
      throw new ValidationError(
        'tenantId query parameter is required',
        [{ field: 'tenantId', message: 'Google onboardings require tenantId as a query parameter' }],
        null,
        path
      );
    }
    const body = await this.httpClient.request<GoogleOnboarding[] | PaginatedResponse<GoogleOnboarding>>(
      path,
      { params }
    );
    return asPage(body);
  }

  /**
   * `GET /cloud/cisco/onboardings?tenantId=`. Tenant id stays a query parameter.
   */
  async listCiscoOnboardings(
    params: CloudOnboardingListParams
  ): Promise<PaginatedResponse<CiscoOnboarding>> {
    const path = '/cloud/cisco/onboardings';
    if (!params?.tenantId) {
      throw new ValidationError(
        'tenantId query parameter is required',
        [{ field: 'tenantId', message: 'Cisco onboardings require tenantId as a query parameter' }],
        null,
        path
      );
    }
    const body = await this.httpClient.request<CiscoOnboarding[] | PaginatedResponse<CiscoOnboarding>>(
      path,
      { params }
    );
    return asPage(body);
  }
}
