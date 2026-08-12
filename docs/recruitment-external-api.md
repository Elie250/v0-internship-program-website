# Energy & Logics Recruitment External API

> Generated from `lib/recruitment/api-docs.ts` — keep that module as the source of truth.

## Overview

Organizations can integrate their HR systems with the Energy & Logics recruitment platform using **organization-scoped API credentials**.

- Web portal and external API share the same authoritative database.
- External API does **not** use browser session cookies.
- Secrets are shown **once** at create/rotate and stored as hashes only.

## Authentication

```
Authorization: Bearer <key_id>:<secret>
```

Example:

```
Authorization: Bearer rk_abc123:rks_def456...
```

The organization is resolved from the credential server-side. Never treat a client-supplied `organization_id` as authoritative.

## Scopes

| Scope | Access |
|-------|--------|
| `jobs:read` | List/get jobs |
| `jobs:write` | Create/update/publish/close jobs |
| `applications:read` | List/get applications + candidate profile snapshots |
| `applications:write` | Update application pipeline status |
| `candidates:read` | Included with application profile fields |
| `documents:read` | Short-lived signed CV URLs |
| `screening:read` | Screening results (no answer keys) |
| `interviews:read` | List interviews |
| `interviews:write` | Create interviews |
| `notes:read` | HR notes / interview internal notes (optional) |
| `webhooks:manage` | Reserved for credential-managed webhook ops |

Credential `access_mode`:

- `organization` — org-wide integration (default)
- `restricted` — only explicitly allow-listed jobs

## Endpoints

Base path: `/api/v1/recruitment`

| Method | Path | Scope |
|--------|------|-------|
| GET | `/jobs` | jobs:read |
| GET | `/jobs/{id}` | jobs:read |
| POST | `/jobs` | jobs:write |
| PATCH | `/jobs/{id}` | jobs:write (`action=publish\|close` supported) |
| GET | `/applications` | applications:read |
| GET | `/applications/{id}` | applications:read |
| PATCH | `/applications/{id}` | applications:write |
| GET | `/applications/{id}/cv` | documents:read |
| GET | `/applications/{id}/screening` | screening:read |
| GET | `/interviews` | interviews:read |
| POST | `/interviews` | interviews:write |
| GET | `/openapi` | any valid credential |

### Example: list jobs

```http
GET /api/v1/recruitment/jobs?limit=50&offset=0
Authorization: Bearer rk_...:rks_...
```

```json
{
  "data": [{ "id": "...", "title": "Electrical Engineer", "status": "published" }],
  "pagination": { "limit": 50, "offset": 0, "total": 1 },
  "request_id": "req_..."
}
```

### Example: signed CV URL

```http
GET /api/v1/recruitment/applications/{id}/cv
Authorization: Bearer rk_...:rks_...
```

Returns a **short-lived** signed URL (`expires_in_seconds: 120`). Never a permanent public CV link.

## Errors

| HTTP | code |
|------|------|
| 401 | unauthorized |
| 403 | insufficient_scope / forbidden |
| 404 | not_found |
| 429 | rate_limited |
| 400 | validation_error |

## Rate limits

- 60 requests / minute / credential
- 600 requests / hour / organization
- Exceeding limits returns HTTP **429** with `Retry-After`

## Webhooks

Managed via the employer portal session APIs:

- `GET/POST/PATCH /api/recruitment/organizations/{id}/webhooks`

Events:

- `application.created`
- `application.status_changed`
- `screening.completed`
- `interview.created`
- `interview.updated`
- `interview.completed`
- `candidate.hired`

### Signature verification

Headers:

- `X-EL-Webhook-Id` — stable event id (idempotent)
- `X-EL-Webhook-Timestamp` — unix seconds
- `X-EL-Webhook-Signature` — `sha256=<hex>`

Signed payload:

```
{timestamp}.{raw_json_body}
```

HMAC-SHA256 with the webhook signing secret. Reject timestamps outside ±300 seconds to limit replay.

Deliveries are stored with status `pending|delivered|failed|abandoned` and retry backoff (1m → 5m → 30m → 120m).

## Credential management (portal)

Session-authenticated (Org Admin / HR):

- `GET/POST/PATCH /api/recruitment/organizations/{id}/api-credentials`

Actions: create, rotate, revoke, activate, deactivate.

## Not exposed

- Answer keys / expected answers
- Integrity raw event mutation
- AI provider credentials
- Platform secrets
- HR notes unless `notes:read` is granted
- Browser session as external auth

## SQL

Apply `scripts/76-recruitment-api.sql` after migration 75.
