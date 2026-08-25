# @wyre-ai/node-blackpoint

Node.js / TypeScript client library for the [Blackpoint Cyber](https://blackpointcyber.com) **CompassOne** API.

CompassOne is Blackpoint's unified MDR (Managed Detection and Response) platform. This SDK provides a fully-typed, zero-dependency client for interacting with the CompassOne REST API — accounts, tenants, assets, detections, cloud MDR onboarding, vulnerabilities, notifications, users, collections, and contact groups.

## Features

- Fully typed with TypeScript
- Zero runtime dependencies (uses the native `fetch` API — Node.js 22+)
- Built-in token-bucket rate limiting
- Typed error hierarchy (`AuthenticationError`, `ForbiddenError`, `NotFoundError`, `ValidationError`, `RateLimitError`, `ServerError`)
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
  // baseUrl defaults to https://api.compassone.blackpointcyber.com/v1
});

// List accounts
const accounts = await client.accounts.list();
console.log(accounts.data);

// Fetch a single tenant
const tenant = await client.tenants.get('tenant-id');

// List assets for a given asset class
const assets = await client.assets.list({ class: 'endpoint' });

// List detections
const detections = await client.detections.list({ severity: ['high', 'critical'] });

// Vulnerabilities
const vulns = await client.vulnerabilities.listVulnerabilities({ severity: ['critical'] });
```

## Configuration

`CompassOneClient` accepts a `CompassOneConfig`:

| Option      | Type     | Required | Default                                                 | Description                    |
| ----------- | -------- | -------- | ------------------------------------------------------- | ------------------------------ |
| `apiToken`  | `string` | yes      | —                                                       | CompassOne API bearer token    |
| `baseUrl`   | `string` | no       | `https://api.compassone.blackpointcyber.com/v1`         | API base URL                   |
| `timeout`   | `number` | no       | `30000`                                                 | Request timeout in ms          |
| `userAgent` | `string` | no       | `@wyre-ai/node-blackpoint`                      | User-Agent header              |

## Resources

- `client.accounts` — accounts
- `client.tenants` — tenants
- `client.assets` — assets and asset relationships
- `client.detections` — detections
- `client.cloudMdr` — cloud MDR onboardings (M365, Google, Cisco)
- `client.contactGroups` — contact groups
- `client.notifications` — notification channels
- `client.users` — users
- `client.collections` — collections
- `client.vulnerabilities` — vulnerabilities, scans, dark web and external exposures

## Error Handling

All API errors extend `ServiceError`:

```ts
import {
  CompassOneClient,
  AuthenticationError,
  RateLimitError,
} from '@wyre-ai/node-blackpoint';

try {
  await client.accounts.list();
} catch (err) {
  if (err instanceof AuthenticationError) {
    // invalid or expired token
  } else if (err instanceof RateLimitError) {
    // err.retryAfter (seconds)
  }
}
```

## License

Apache-2.0 — see [LICENSE](./LICENSE).

<!-- source recovered + published via fleet release pipeline -->
