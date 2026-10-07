## [1.1.0](https://github.com/WYRE-AI/node-blackpoint/compare/v1.0.2...v1.1.0) (2026-10-07)

### Bug Fixes

* **api:** default base URL is `https://api.blackpointcyber.com/v1`. A base URL with or without `/v1` is accepted and `/v1` is not doubled. Request paths no longer force a trailing slash (the published OpenAPI paths have none, and the live `GET /v1/accounts` and `GET /v1/tenants` calls do not use one).
* **tenancy:** tenant-scoped asset and alert-group calls send `x-tenant-id`. `tenantId` is not also sent as a query parameter on those routes. Cloud onboarding keeps `tenantId` as a query parameter, matching the published OpenAPI.
* **assets:** `class` is required and must be a documented CompassOne class (`CONTAINER`, `DEVICE`, `FRAMEWORK`, `NETSTAT`, `PERSON`, `PROCESS`, `SERVICE`, `SOFTWARE`, `SOURCE`, `SURVEY`, `USER`). `CLOUD` is not in that enum. Relationship direction is `in` or `out`, and the far-side class is sent as `entityClass`.
* **detections:** `GET /detections` is 404. Lists and gets go to `GET /alert-groups`, paged with `skip`/`take`. `client.detections` remains as a deprecated alias (`page`/`pageSize` convert to `skip`/`take`; `fromDate` is sent as `since`).
* **vulnerabilities:** `GET /vulnerabilities` and `GET /scans` replace `/vm-vulnerabilities` (those paths returned 403 on 2026-10-07, so they exist; a non-entitled key throws `NotEntitledError`). `/vm-darkweb` and `/vm-external` are marked unconfirmed — they are not in compassone-sdk 0.0.60 and `/vm-darkweb` returned 404 — and throw `NotFoundError` or `NotEntitledError` with status, path, and body.
* **errors:** failures carry HTTP status, method, path, and response body. `toJSON()` redacts the bearer token and any `Authorization` field so `JSON.stringify(error)` is not `{}`.
* **pagination:** `meta.currentPage`, `meta.totalItems`, `meta.pageSize`, and `meta.totalPages` are copied onto `pagination`. Skip/take metadata is copied when that is what the route returns.
* **contact-groups:** `GET /contact-groups` is 404. The published path is `GET /accounts/{accountId}/contact-groups`.
* **cloud:** `GET /cloud-mdr` is 404. Google and Cisco lists use `/cloud/google/onboardings` and `/cloud/cisco/onboardings`. There is no list-all M365 route; published reads are `/cloud/ms365/connections/{connectionId}`.
* **rate limit:** the local token bucket matches the key quota of 2000 requests / 15 minutes. A `Retry-After` longer than the request timeout throws `RateLimitError` immediately.
* **config:** `resolveBaseUrl` accepts only `https`, plus `http` on `localhost`, `127.0.0.1`, and `[::1]`.
* **errors:** token redaction no longer skips secrets shorter than 8 characters. An empty secret is left unchanged.

### Features

* add `client.alertGroups` and `NotEntitledError` (a 403, and a subclass of `ForbiddenError`).

## [1.0.2](https://github.com/WYRE-AI/node-blackpoint/compare/v1.0.1...v1.0.2) (2026-08-25)


### Bug Fixes

* migrate to WYRE-AI org (npm scope, ghcr namespace, registry) ([#2](https://github.com/WYRE-AI/node-blackpoint/issues/2)) ([360114b](https://github.com/WYRE-AI/node-blackpoint/commit/360114b02b968997fd0b30a3c9e286ea38ec9107))

## [1.0.1](https://github.com/WYRE-AI/node-blackpoint/compare/v1.0.0...v1.0.1) (2026-07-18)


### Bug Fixes

* **publish:** force republish — v1.0.0 tarball is corrupted on GH Packages ([#1](https://github.com/WYRE-AI/node-blackpoint/issues/1)) ([242f0d3](https://github.com/WYRE-AI/node-blackpoint/commit/242f0d33668f2514f45413b0c2d2dd7cc6e482f7))

# 1.0.0 (2026-07-06)


### Bug Fixes

* **ci:** bump release job to Node 22 (semantic-release v25 requires >=22) ([cadd4dc](https://github.com/WYRE-AI/node-blackpoint/commit/cadd4dcb35d024c82eee55c0592433070b2d43f9))
* **ci:** pass tests with no test files (vitest --passWithNoTests) ([f9811d0](https://github.com/WYRE-AI/node-blackpoint/commit/f9811d0d4d63cf50a33248fb9f1d0f6aca269588))


### Features

* recover node-blackpoint SDK source from published tarball sourcemaps ([10004fa](https://github.com/WYRE-AI/node-blackpoint/commit/10004fac941a43c073c2ac43003f2181ecb0ac37))

# 1.0.0 (2026-07-06)


### Bug Fixes

* **ci:** bump release job to Node 22 (semantic-release v25 requires >=22) ([cadd4dc](https://github.com/WYRE-AI/node-blackpoint/commit/cadd4dcb35d024c82eee55c0592433070b2d43f9))
* **ci:** pass tests with no test files (vitest --passWithNoTests) ([f9811d0](https://github.com/WYRE-AI/node-blackpoint/commit/f9811d0d4d63cf50a33248fb9f1d0f6aca269588))


### Features

* recover node-blackpoint SDK source from published tarball sourcemaps ([10004fa](https://github.com/WYRE-AI/node-blackpoint/commit/10004fac941a43c073c2ac43003f2181ecb0ac37))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases are managed automatically by [semantic-release](https://semantic-release.gitbook.io/)
based on the [Conventional Commits](https://www.conventionalcommits.org/) history.

## [Unreleased]
