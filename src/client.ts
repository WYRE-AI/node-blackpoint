import { CompassOneConfig, validateConfig } from './config.js';
import { HttpClient } from './http.js';
import { AccountsResource } from './resources/accounts.js';
import { AssetsResource } from './resources/assets.js';
import { TenantsResource } from './resources/tenants.js';
import { AlertGroupsResource } from './resources/alert-groups.js';
import { DetectionsResource } from './resources/detections.js';
import { CloudMdrResource } from './resources/cloud-mdr.js';
import { ContactGroupsResource } from './resources/contact-groups.js';
import { NotificationsResource } from './resources/notifications.js';
import { UsersResource } from './resources/users.js';
import { CollectionsResource } from './resources/collections.js';
import { VulnerabilitiesResource } from './resources/vulnerabilities.js';

export class CompassOneClient {
  private readonly httpClient: HttpClient;

  public readonly accounts: AccountsResource;
  public readonly assets: AssetsResource;
  public readonly tenants: TenantsResource;
  public readonly alertGroups: AlertGroupsResource;
  /**
   * @deprecated `GET /detections` returns 404. Use {@link alertGroups}.
   * This alias forwards list/get onto alert groups (skip/take, `x-tenant-id`).
   */
  public readonly detections: DetectionsResource;
  public readonly cloudMdr: CloudMdrResource;
  public readonly contactGroups: ContactGroupsResource;
  public readonly notifications: NotificationsResource;
  public readonly users: UsersResource;
  public readonly collections: CollectionsResource;
  public readonly vulnerabilities: VulnerabilitiesResource;

  constructor(config: CompassOneConfig) {
    validateConfig(config);
    this.httpClient = new HttpClient(config);

    this.accounts = new AccountsResource(this.httpClient);
    this.assets = new AssetsResource(this.httpClient);
    this.tenants = new TenantsResource(this.httpClient);
    this.alertGroups = new AlertGroupsResource(this.httpClient);
    this.detections = new DetectionsResource(this.alertGroups);
    this.cloudMdr = new CloudMdrResource(this.httpClient);
    this.contactGroups = new ContactGroupsResource(this.httpClient);
    this.notifications = new NotificationsResource(this.httpClient);
    this.users = new UsersResource(this.httpClient);
    this.collections = new CollectionsResource(this.httpClient);
    this.vulnerabilities = new VulnerabilitiesResource(this.httpClient);
  }
}
