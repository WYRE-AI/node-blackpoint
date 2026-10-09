# @wyre-ai/node-blackpoint

Node.js / TypeScript client library for the [Blackpoint Cyber](https://blackpointcyber.com) **CompassOne** API.

CompassOne is Blackpoint's unified MDR (Managed Detection and Response) platform. This SDK provides a fully-typed, zero-dependency client for the CompassOne REST API — accounts, tenants, assets, alert groups, cloud onboarding, vulnerabilities, notifications, users, collections, and contact groups.

## Features

- Fully typed with TypeScript
- Zero runtime dependencies (uses the native `fetch` API — Node.js 22+)
- Token-bucket rate limiting aligned to the published key quota (2000 requests / 15 minutes)
- Typed error hierarchy (`AuthenticationError`, `NotEntitledError`, `NotFoundError`, `ValidationError`, `RateLimitError`, `ServerError`)
- Errors serialize with HTTP status, method, path, and response body (`JSON.stringify` on a bare `Error` is `{}`)
- ESM and CommonJS builds

## Installation

This package is published to GitHub Packages under the `@wyre-ai` scope.

```bash
npm install @wyre-ai/node-blackpoint
```

Configure your `.npmrc` so the scope resolves to GitHub Packages:

```
@wyre-ai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

## Requirements

- Node.js >= 22.0.0

## Quick Start

```ts
import { CompassOneClient } from '@wyre-ai/node-blackpoint';

const client = new CompassOneClient({
  apiToken: process.env.COMPASSONE_API_TOKEN!,
  // baseUrl defaults to https://api.blackpointcyber.com/v1
  // https://api.blackpointcyber.com is accepted and normalized to the same URL
});

const accounts = await client.accounts.list();
console.log(accounts.data, accounts.pagination);

const tenant = await client.tenants.get('tenant-id');

// class is required. Documented values include DEVICE and USER.
// tenantId is sent as the x-tenant-id header.
const assets = await client.assets.list({
  class: 'DEVICE',
  tenantId: tenant.id,
});

// Alert groups replaced /detections. Paged with skip/take.
const alerts = await client.alertGroups.list({
  tenantId: tenant.id,
  skip: 0,
  take: 50,
  status: 'OPEN',
});

// 403 on /vulnerabilities or /scans is NotEntitledError for a key without that product.
const vulns = await client.vulnerabilities.listVulnerabilities({
  tenantId: tenant.id,
});
```

## Configuration

`CompassOneClient` accepts a `CompassOneConfig`:

| Option      | Type     | Required | Default                                      | Description                                                                 |
| ----------- | -------- | -------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `apiToken`  | `string` | yes      | —                                            | CompassOne API bearer token (`Authorization: Bearer`)                      |
| `baseUrl`   | `string` | no       | `https://api.blackpointcyber.com/v1`         | API base URL. A host with or without `/v1` is accepted; `/v1` is not doubled. |
| `timeout`   | `number` | no       | `30000`                                      | Request timeout in ms                                                       |
| `userAgent` | `string` | no       | `@wyre-ai/node-blackpoint`                   | User-Agent header                                                           |

## Resources

- `client.accounts` — `GET /accounts`
- `client.tenants` — `GET /tenants`
- `client.assets` — `GET /assets` (`class` query param required; `x-tenant-id` required)
- `client.alertGroups` — `GET /alert-groups` (skip/take, `x-tenant-id` required)
- `client.detections` — **deprecated** alias of `client.alertGroups`. `GET /detections` is 404
- `client.cloudMdr` — `GET /cloud/google/onboardings` and `GET /cloud/cisco/onboardings` (`tenantId` query param). `GET /cloud-mdr` is 404
- `client.contactGroups` — `GET /accounts/{accountId}/contact-groups`
- `client.notifications` — notification channels
- `client.users` — `GET /users` (403 when the key is not entitled)
- `client.collections` — collections
- `client.vulnerabilities` — `GET /vulnerabilities` and `GET /scans` (403 when not entitled). Dark web (`/vm-darkweb`) and external (`/vm-external`) paths are **unconfirmed** and throw `NotFoundError` or `NotEntitledError` with status, path, and body

### Asset classes

Documented inventory classes (the `class` query parameter):

`CONTAINER`, `DEVICE`, `FRAMEWORK`, `NETSTAT`, `PERSON`, `PROCESS`, `SERVICE`, `SOFTWARE`, `SOURCE`, `SURVEY`, `USER`.

`CLOUD` is not in that enum. Relationship reads use `entityClass` and also allow `ALERT`, `ALERTGROUP`, `EVENT`, `INCIDENT`, and `VULNERABILITY`. Direction is `in` or `out`.

### Pagination

List routes return `data` plus `meta` (`currentPage`, `totalItems`, `pageSize`, `totalPages`). The client copies that onto `pagination` (`page`, `totalCount`, `pageSize`, `totalPages`, `hasNext`). Alert groups are requested with `skip` and `take`; when `meta` includes those fields they are copied too.

## Error Handling

All API errors extend `ServiceError` and include `status`, `path`, and `body`. `toJSON()` redacts the bearer token and any `Authorization` field. A 403 is `NotEntitledError` (also `instanceof ForbiddenError`). A 404 is `NotFoundError`.

```ts
import {
  CompassOneClient,
  AuthenticationError,
  NotEntitledError,
  NotFoundError,
  RateLimitError,
} from '@wyre-ai/node-blackpoint';

try {
  await client.vulnerabilities.listVulnerabilities();
} catch (err) {
  if (err instanceof NotEntitledError) {
    // path exists; this key is not entitled. err.status, err.path, err.body
  } else if (err instanceof NotFoundError) {
    // err.path is the unconfirmed or missing route
  } else if (err instanceof AuthenticationError) {
    // invalid or expired token
  } else if (err instanceof RateLimitError) {
    // err.retryAfter (seconds). Quota is 2000 requests / 15 minutes per key.
  }
  console.error(JSON.stringify(err));
}
```

## License

Apache-2.0 — see [LICENSE](./LICENSE).
