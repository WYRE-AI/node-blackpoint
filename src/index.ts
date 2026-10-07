export { CompassOneClient } from './client.js';
export {
  DEFAULT_BASE_URL,
  DEFAULT_CONFIG,
  RATE_LIMIT_CAPACITY,
  RATE_LIMIT_REFILL_PER_SECOND,
  RATE_LIMIT_WINDOW_SECONDS,
  resolveBaseUrl,
} from './config.js';
export type { CompassOneConfig } from './config.js';

export type { PaginatedResponse, PaginationInfo, PaginationMeta } from './pagination.js';

export {
  ServiceError,
  AuthenticationError,
  ForbiddenError,
  NotEntitledError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
} from './errors.js';
export type { ServiceErrorBody } from './errors.js';

export type {
  BaseEntity,
  CreateParams,
  ListParams,
  SortOrder,
  UpdateParams,
} from './types/common.js';

export type {
  Account,
  AccountBillingVersion,
  AccountGetParams,
  AccountListParams,
  AccountPartnershipType,
} from './types/accounts.js';

export {
  ASSET_CLASSES,
  RELATIONSHIP_ENTITY_CLASSES,
} from './types/assets.js';
export type {
  Asset,
  AssetClass,
  AssetGetParams,
  AssetListParams,
  AssetRelationship,
  AssetRelationshipDirection,
  AssetRelationshipListParams,
  AssetStatus,
  RelationshipEntityClass,
} from './types/assets.js';

export type { Tenant, TenantListParams } from './types/tenants.js';

export type {
  AlertGroup,
  AlertGroupGetParams,
  AlertGroupListParams,
  AlertGroupSortColumn,
  AlertGroupStatus,
  AlertGroupType,
} from './types/alert-groups.js';

export type { Detection, DetectionListParams } from './types/detections.js';

export type {
  CiscoOnboarding,
  CloudOnboarding,
  CloudOnboardingListParams,
  CloudProvider,
  GoogleOnboarding,
  M365Onboarding,
} from './types/cloud-mdr.js';

export type {
  ContactGroup,
  ContactGroupGetParams,
  ContactGroupListParams,
  ContactGroupMember,
} from './types/contact-groups.js';

export type {
  EmailChannel,
  NotificationChannel,
  NotificationChannelListParams,
  NotificationChannelType,
  WebhookChannel,
} from './types/notifications.js';

export type { User, UserListParams } from './types/users.js';

export type { Collection, CollectionListParams } from './types/collections.js';

export type {
  DarkWebExposure,
  ExposureListParams,
  ExternalExposure,
  ScanListParams,
  ScanStatus,
  Vulnerability,
  VulnerabilityListParams,
  VulnerabilityScan,
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from './types/vulnerabilities.js';
