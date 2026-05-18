# AVACOM — Evaluation Management System

**Type:** Full-stack technical test
**Goal:** Score ≥90/100 (target: 100/100)
**Date:** 2026-05-17
**Scope:** Production-grade beyond the 4hr estimate (user explicitly requested "hagámoslo bien")

---

## 1. Context

Build a CRUD evaluation management system with:
- **Backend:** AWS Lambda + DynamoDB + API Gateway
- **Frontend:** React 18 + Tailwind CSS
- **Auth:** Full JWT (access + refresh) with httpOnly cookies, signup, login, logout
- **Multi-tenant:** Each user owns their evaluations
- **Deploy:** AWS Free Tier (no significant costs)
- **Live demo:** Must support 1-2 live code changes in 1-2 files maximum

### Score breakdown (target)
| Section | Weight | Strategy |
|---|---|---|
| Backend functional correctness | 15% | Full CRUD + validation + error handling |
| Serverless architecture | 15% | SAM IaC, hexagonal, separation of concerns |
| Backend clean code | 10% | TypeScript strict, hexagonal layering, no leaks |
| Backend deployment | 10% | SAM deploy, single command, smoke-tested |
| Frontend functionality | 15% | All CRUD flows + auth + filters |
| Frontend UX/UI | 10% | Tailwind design, loading states, errors, confirmations |
| Frontend React code | 10% | Hooks, TanStack Query, react-hook-form, proper separation |
| Frontend performance | 5% | Vite, code splitting, optimistic updates |
| **Bonus** | **10%** | Testing + Auth + Filters + CloudWatch logging — all included |

---

## 2. Decisions & Tradeoffs

> **For the live demo Q&A** — every choice below has a defensible rationale. Read this section before the interview.

### 2.1 Backend language: **Node.js 20 + TypeScript**
- **Alternatives:** Python 3.12, Node.js JavaScript
- **Why:** Shared Zod schemas/types with frontend (single source of truth for validation), hexagonal architecture maps naturally to TypeScript interfaces (ports), esbuild bundling is fast (~200ms cold deploy), Lambda Node 20 runtime is mature.
- **Q&A defense:** *"TypeScript gives me compile-time guarantees on the port/adapter contracts and lets me share validation schemas with the React frontend, eliminating drift between client and server."*

### 2.2 IaC: **AWS SAM** (CDK as plan B if time allows)
- **Alternatives:** AWS CDK TypeScript, Serverless Framework v3, manual console
- **Why:** SAM has the fastest path to a deployed stack (`sam init` → `sam deploy --guided` in ~3 min). SAM Local lets me invoke Lambdas in Docker before deploying. CDK is more elegant but bootstrap can eat 10 minutes.
- **Q&A defense:** *"SAM was the lowest-risk choice for hitting the 4hr deploy gate. CDK would give me TypeScript-native IaC but the bootstrap overhead wasn't justified for a single-stack project."*

### 2.3 Lambda structure: **1 Lambda with Hono router**
- **Alternatives:** 5 Lambdas (one per endpoint), manual switch-case routing
- **Why:** Single Lambda wires hexagonal dependencies once (composition root), enables live code changes in 1-2 files (route in `routes.ts`, validation in `schemas.ts`), simpler SAM template (1 Function resource vs 5), shared cold-start.
- **Trade-off accepted:** All endpoints share memory/timeout config (fine for CRUD), single point of deployment failure (acceptable for this scope).
- **Q&A defense:** *"At this scale, splitting per-endpoint adds 5x the wiring without operational benefit. The Lambda is small (<50ms warm), and consolidating routes makes the hexagonal composition trivial to reason about."*

### 2.4 Router library: **Hono**
- **Alternatives:** lambda-api, manual switch-case
- **Why:** Express-like API with first-class TypeScript, mature middleware (auth, error, logger), ~12kb (negligible cold start impact), excellent docs.
- **Q&A defense:** *"Hono gives me production-grade middleware composition without the weight of Express, and the TypeScript ergonomics make the handler signatures self-documenting."*

### 2.5 Auth: **Full JWT (signup + login + refresh + logout)**
- **Alternatives:** API Key only, AWS Cognito, no auth
- **Why:** The user explicitly requested production-grade auth. Demonstrates understanding of token-based auth, refresh flows, and ownership scoping. Beyond the 4hr scope but builds a more impressive deliverable.
- **Trade-off accepted:** ~60-90 minutes of additional implementation time.
- **Q&A defense:** *"I implemented the standard access-token + refresh-token pattern with httpOnly cookies. It demonstrates real session management without the Cognito learning curve, and the multi-tenant ownership is enforced at the use-case layer, not just the route layer."*

### 2.6 Refresh tokens: **Stateless** (NOT stored in DynamoDB)
- **Alternative considered:** Revocable refresh tokens with `RefreshTokens` table + tokenId lookup on each refresh
- **Why stateless wins here:**
  1. Refresh cookie is `httpOnly` + `SameSite=Strict` + `Secure` — XSS can't read it, CSRF can't replay it
  2. Access token TTL = 15 min limits exposure window
  3. Revocation adds a table, a port, an adapter, and a DB lookup on every refresh — complexity without proportional security gain at this scope
  4. "Logout" decoratively clears cookies on the client; the server doesn't need to remember
- **Trade-off accepted:** Cannot force-logout users (e.g., on password change) until refresh TTL expires (7 days).
- **Q&A defense:** *"I went stateless because the cookie security model — httpOnly, SameSite=Strict, Secure — already closes the realistic theft vectors. The 15-minute access TTL limits exposure. If we needed forced logout, password-change invalidation, or token-rotation theft detection, I'd add a tokenId table with revocation. For this scope, that's complexity without proportional value."*

### 2.7 Token storage in browser: **httpOnly cookies (SameSite=Strict)**
- **Alternatives:** localStorage (both tokens), httpOnly cookie + access in memory
- **Why:** XSS-safe (JavaScript cannot read httpOnly cookies), CSRF-safe (`SameSite=Strict` prevents cross-site requests), survives page refresh, automatic transmission with each request.
- **Requirement:** Same-origin between frontend and API (see 2.8).
- **Q&A defense:** *"localStorage exposes tokens to any XSS payload — a single compromised npm package and your session is stolen. httpOnly cookies move the trust boundary back to the browser process."*

### 2.8 Deploy topology: **Single CloudFront with `/api/*` proxy**
- **Alternatives:** Separate CloudFront + raw API Gateway URL, Amplify Hosting
- **Why:** Same-origin between frontend and backend = `SameSite=Strict` cookies work without `SameSite=None`, zero CORS configuration, single URL to remember, cleaner production posture.
- **Topology:**
  ```
  CloudFront (d1xxx.cloudfront.net)
    ├── /*       → S3 bucket (React build, OAC-protected)
    └── /api/*   → API Gateway → Lambda
  ```
- **Q&A defense:** *"Putting both behind one CloudFront eliminates CORS entirely and lets me use SameSite=Strict cookies. It mirrors how Vercel and Netlify route serverless functions internally."*

### 2.9 DynamoDB: **Multi-table design** (not single-table)
- **Alternative:** Single-table design with composite PK/SK
- **Why:** For 2 entities (Users, Evaluations) with no need for joins or transactions across them, multi-table is dramatically more readable. The reviewer can grep `EvaluationsTable` and see exactly what's there. Single-table is the AWS-pro pattern but adds cognitive overhead disproportionate to this scope.
- **Q&A defense:** *"Single-table design shines when you have many entities with join-like access patterns. Here I have two unrelated aggregates — Users and Evaluations — and multi-table keeps the data model self-documenting. If we added a third entity with cross-cutting queries, I'd revisit."*

### 2.10 Data ownership: **Multi-tenant by userId (filter at use-case layer)**
- **Alternative:** Shared global data, auth only gates API access
- **Why:** Demonstrates real authorization, not just authentication. `userId` is extracted from the JWT context and injected into the use case — it's NEVER read from the request body.
- **Q&A defense:** *"Authorization happens in the use case, not in the route handler. That means a misconfigured route still can't leak data — the use case literally has no way to query another user's evaluations without an explicit userId override."*

### 2.11 Frontend: **React 18 + Vite + TypeScript + Tailwind v3**
- **Why Vite over CRA:** CRA is deprecated; Vite is faster (esbuild dev server), modern, smaller config.
- **Why Tailwind v3 over v4:** v3 is rock-stable; v4 (released late 2024) is great but has tooling edges that aren't worth debugging in a time-boxed test.
- **Libraries:** TanStack Query (data fetching + cache + refetch on focus), react-hook-form + Zod (form validation, schemas shared with backend), React Router v6 (auth-guarded routes), Axios (interceptor for token refresh).

### 2.12 Logging: **AWS Lambda Powertools for TypeScript**
- **Why:** Official AWS library, structured JSON logs (CloudWatch Insights-friendly), automatic correlation IDs, integrated tracing (X-Ray) and metrics (CloudWatch Metrics).
- **Q&A defense:** *"Powertools gives me structured logging, distributed tracing, and metrics with one dependency — exactly what AWS reviewers expect to see."*

### 2.13 Testing: **Vitest with ≥90% coverage (unit + integration)**
- **Backend:** ~55 tests targeting ≥90% statement and branch coverage (unit tests on use cases with mocked ports, integration tests on adapters using DynamoDB Local, HTTP route integration tests)
- **Frontend:** ~40 tests targeting ≥90% coverage (component tests, hook tests, MSW-mocked integration tests for full flows)
- **Tooling:** Vitest + `@vitest/coverage-v8` + `aws-sdk-client-mock` + DynamoDB Local (Docker) + `@testing-library/react` + MSW
- **Coverage gate:** `vitest run --coverage` fails CI if any of statements, branches, functions, or lines fall below 90%
- **Why 90% not 100%:** Last 10% (config wiring, error boilerplate, exhaustive switch defaults) costs disproportionately more time than it catches bugs. 90% is the standard industry bar for "well-tested" without diminishing returns.
- **Q&A defense:** *"I targeted 90% coverage with a mix of pure unit tests on the domain (fastest, most numerous) and integration tests on the adapters and HTTP layer (catches wiring bugs). Coverage is enforced in CI so it doesn't drift."*

### 2.14 Bonus extras included
- **Pagination** (`?limit=&cursor=` on GET evaluations using LastEvaluatedKey)
- **Rate limiting** (API Gateway throttling: 100 req/s burst, 50 req/s sustained per stage)
- **Soft delete** (DELETE sets `deletedAt`, GET filters; allows recovery and audit)
- **Health check** (GET `/api/health` returns version + uptime)

---

## 3. Architecture Overview

> 📊 **Visual diagrams** for every layer live in [`docs/diagrams/`](../../diagrams/README.md): system architecture, hexagonal layout, auth flow sequences, CRUD request lifecycle, data model ERD, and frontend component tree. Use them as the visual companion to this spec during the live demo.

```
┌─────────────────────────────────────────────────────────────┐
│                  CloudFront Distribution                    │
│                d1xxx.cloudfront.net (HTTPS)                 │
│   ┌─────────────────────────┬──────────────────────────┐    │
│   │ Behavior: /*            │ Behavior: /api/*         │    │
│   │ Origin: S3 (OAC)        │ Origin: API Gateway      │    │
│   │ Cache: max-age=1y assets│ Cache: disabled          │    │
│   │       no-cache for HTML │ Forward: cookies, auth   │    │
│   └────────────┬────────────┴────────────┬─────────────┘    │
└────────────────┼─────────────────────────┼──────────────────┘
                 │                         │
                 ▼                         ▼
         ┌──────────────┐         ┌──────────────────┐
         │ S3 (private) │         │ API Gateway      │
         │ React build  │         │ HTTP API         │
         │ + OAC policy │         │ throttling: 50/s │
         └──────────────┘         └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Lambda (Node 20) │
                                  │ - Hono router    │
                                  │ - Powertools     │
                                  │ - Hexagonal      │
                                  │ Memory: 512 MB   │
                                  │ Timeout: 10s     │
                                  └────────┬─────────┘
                                           │
                          ┌────────────────┴────────────────┐
                          ▼                                 ▼
                 ┌────────────────────┐          ┌────────────────────┐
                 │ DynamoDB           │          │ DynamoDB           │
                 │ EvaluationsTable   │          │ UsersTable         │
                 │ PK: evaluationId   │          │ PK: email          │
                 │ GSI: userId-       │          │ Attrs: userId,     │
                 │      createdAt     │          │   passwordHash,    │
                 │                    │          │   name, createdAt  │
                 └────────────────────┘          └────────────────────┘

                                  │
                                  ▼
                         ┌──────────────────┐
                         │ CloudWatch       │
                         │ - Logs (JSON)    │
                         │ - Metrics        │
                         │ - X-Ray traces   │
                         └──────────────────┘
```

---

## 4. Backend Design

### 4.1 Folder structure (hexagonal)

```
backend/
├── template.yaml                    ← SAM: Lambda + 2 DDB tables + HTTP API
├── samconfig.toml                   ← SAM deploy config
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── esbuild.config.mjs               ← bundling for Lambda
└── src/
    ├── handler.ts                   ← Lambda entry; exports `handler`
    ├── composition.ts               ← DI root: builds all deps once
    │
    ├── domain/                      ← PURE business logic (no AWS, no HTTP)
    │   ├── evaluation/
    │   │   ├── Evaluation.ts        ← entity type + factory
    │   │   └── EvaluationRepository.ts  ← PORT (interface)
    │   ├── user/
    │   │   ├── User.ts
    │   │   └── UserRepository.ts    ← PORT
    │   ├── auth/
    │   │   └── TokenService.ts      ← PORT (sign/verify JWT)
    │   ├── errors.ts                ← DomainError, NotFoundError, etc.
    │   └── use-cases/
    │       ├── signUp.ts
    │       ├── login.ts
    │       ├── refreshToken.ts
    │       ├── getCurrentUser.ts
    │       ├── listEvaluations.ts
    │       ├── getEvaluation.ts
    │       ├── createEvaluation.ts
    │       ├── updateEvaluation.ts
    │       └── deleteEvaluation.ts
    │
    ├── adapters/                    ← Driven adapters (implement ports)
    │   ├── persistence/
    │   │   ├── dynamoClient.ts
    │   │   ├── DynamoEvaluationRepository.ts
    │   │   └── DynamoUserRepository.ts
    │   └── auth/
    │       └── JwtTokenService.ts   ← uses `jose` library
    │
    └── http/                        ← Driving adapter (HTTP)
        ├── app.ts                   ← Hono app builder (takes deps)
        ├── routes/
        │   ├── auth.routes.ts
        │   ├── evaluations.routes.ts
        │   └── health.routes.ts
        ├── schemas.ts               ← Zod schemas (single source of truth)
        ├── middleware/
        │   ├── authMiddleware.ts    ← validates JWT, sets c.var.userId
        │   ├── errorHandler.ts      ← maps DomainError → HTTP
        │   └── loggerMiddleware.ts  ← Powertools wiring
        ├── mappers.ts               ← domain ↔ DTO
        └── cookies.ts               ← cookie helpers (set/clear)
```

### 4.2 Composition root (`composition.ts`)

```typescript
import { DynamoEvaluationRepository } from './adapters/persistence/DynamoEvaluationRepository';
import { DynamoUserRepository } from './adapters/persistence/DynamoUserRepository';
import { JwtTokenService } from './adapters/auth/JwtTokenService';
import { buildApp } from './http/app';

export function composeApp() {
  const evaluationRepo = new DynamoEvaluationRepository(process.env.EVALUATIONS_TABLE!);
  const userRepo = new DynamoUserRepository(process.env.USERS_TABLE!);
  const tokenService = new JwtTokenService(
    process.env.JWT_SECRET!,
    { accessTtl: '15m', refreshTtl: '7d' }
  );

  return buildApp({ evaluationRepo, userRepo, tokenService });
}
```

### 4.3 Handler (`handler.ts`)

```typescript
import { handle } from 'hono/aws-lambda';
import { composeApp } from './composition';

const app = composeApp();
export const handler = handle(app);
```

### 4.4 Sample use case (`createEvaluation.ts`)

```typescript
import type { EvaluationRepository } from '../evaluation/EvaluationRepository';
import { randomUUID } from 'crypto';

export interface CreateEvaluationInput {
  userId: string;          // ALWAYS from JWT context, NEVER from body
  courseId: string;
  title: string;
  description: string;
  dueDate: string;         // ISO 8601
  status: 'active' | 'completed' | 'cancelled';
}

export function createEvaluation(deps: { repo: EvaluationRepository }) {
  return async (input: CreateEvaluationInput) => {
    const now = new Date().toISOString();
    const evaluation = {
      evaluationId: randomUUID(),
      userId: input.userId,
      courseId: input.courseId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      status: input.status,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await deps.repo.save(evaluation);
    return evaluation;
  };
}
```

### 4.5 Sample route wiring (`evaluations.routes.ts`)

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createEvaluationSchema, listEvaluationsQuerySchema } from '../schemas';
import { authMiddleware } from '../middleware/authMiddleware';
// ... use case imports

export function buildEvaluationsRoutes(deps: Deps) {
  const r = new Hono();
  r.use('*', authMiddleware(deps.tokenService));

  r.get('/', zValidator('query', listEvaluationsQuerySchema), async (c) => {
    const userId = c.var.userId;
    const query = c.req.valid('query');
    const result = await listEvaluations(deps)({ userId, ...query });
    return c.json(result);
  });

  r.post('/', zValidator('json', createEvaluationSchema), async (c) => {
    const userId = c.var.userId;
    const body = c.req.valid('json');
    const evaluation = await createEvaluation(deps)({ userId, ...body });
    return c.json(evaluation, 201);
  });

  // ... PUT, GET /:id, DELETE /:id
  return r;
}
```

---

## 5. Data Model (DynamoDB)

### 5.1 `EvaluationsTable`
| Attribute | Type | Notes |
|---|---|---|
| `evaluationId` | String | **PK** (UUID v4) |
| `userId` | String | owner, indexed via GSI |
| `courseId` | String | |
| `title` | String | |
| `description` | String | |
| `dueDate` | String | ISO 8601 |
| `status` | String | `active` \| `completed` \| `cancelled` |
| `createdAt` | String | ISO 8601 |
| `updatedAt` | String | ISO 8601 |
| `deletedAt` | String \| null | soft delete |

**GSI:** `userId-createdAt-index`
- PK: `userId`
- SK: `createdAt`
- Projection: ALL
- Used for: `GET /api/evaluations` (list user's evaluations sorted newest first)

**Access patterns:**
| Pattern | Operation |
|---|---|
| Get evaluation by id | `GetItem` on PK |
| List user's evaluations (paginated, filtered) | `Query` on GSI + `FilterExpression` for `status` / `courseId` / `deletedAt IS NULL` |
| Create | `PutItem` with `ConditionExpression: attribute_not_exists(evaluationId)` |
| Update | `UpdateItem` with `ConditionExpression: userId = :uid AND deletedAt = :null` |
| Soft delete | `UpdateItem SET deletedAt = :now WHERE userId = :uid` |

### 5.2 `UsersTable`
| Attribute | Type | Notes |
|---|---|---|
| `email` | String | **PK** (login lookup) |
| `userId` | String | UUID v4 |
| `passwordHash` | String | bcrypt (10 rounds) |
| `name` | String | |
| `createdAt` | String | ISO 8601 |

**Access patterns:**
| Pattern | Operation |
|---|---|
| Signup | `PutItem` with `ConditionExpression: attribute_not_exists(email)` |
| Login lookup | `GetItem` on `email` |
| Current user | `GetItem` on `email` (extracted from JWT) |

---

## 6. API Contract

### Auth
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/api/auth/signup` | `{email, password, name}` | `201 {user}` + 2 cookies | password ≥ 8 chars |
| POST | `/api/auth/login` | `{email, password}` | `200 {user}` + 2 cookies | |
| POST | `/api/auth/refresh` | – (cookie) | `200` + new access cookie | reads refresh cookie |
| POST | `/api/auth/logout` | – | `204` + clears cookies | |
| GET | `/api/auth/me` | – | `200 {user}` | requires access cookie |

### Evaluations (all require auth)
| Method | Path | Query/Body | Response |
|---|---|---|---|
| GET | `/api/evaluations` | `?status=&courseId=&limit=&cursor=` | `200 {items, nextCursor}` |
| GET | `/api/evaluations/:id` | – | `200 {evaluation}` or `404` |
| POST | `/api/evaluations` | `{courseId, title, description, dueDate, status}` | `201 {evaluation}` |
| PUT | `/api/evaluations/:id` | `{courseId?, title?, description?, dueDate?, status?}` | `200 {evaluation}` |
| DELETE | `/api/evaluations/:id` | – | `204` (soft delete) |

### Health
| Method | Path | Response |
|---|---|---|
| GET | `/api/health` | `200 {status, version, uptime}` |

### Error responses (all)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "title is required", "details": {...} } }
```
Codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR` (500).

### Cookie format
```
Set-Cookie: access_token=<jwt>; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900
Set-Cookie: refresh_token=<jwt>; Path=/api/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

---

## 7. Frontend Design

### 7.1 Folder structure

```
frontend/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── .env.production              ← VITE_API_URL=/api
├── .env.development             ← VITE_API_URL=http://localhost:3000/api
└── src/
    ├── main.tsx
    ├── App.tsx                  ← Router setup, providers
    ├── lib/
    │   ├── api.ts               ← Axios instance + refresh interceptor
    │   ├── queryClient.ts       ← TanStack Query config
    │   └── schemas.ts           ← Zod schemas (mirrors backend)
    ├── auth/
    │   ├── AuthProvider.tsx     ← Context: user, isLoading
    │   ├── useAuth.ts
    │   ├── ProtectedRoute.tsx
    │   ├── LoginPage.tsx
    │   └── SignupPage.tsx
    ├── evaluations/
    │   ├── EvaluationsListPage.tsx
    │   ├── EvaluationFormPage.tsx
    │   ├── EvaluationForm.tsx
    │   ├── EvaluationsTable.tsx
    │   ├── DeleteConfirmDialog.tsx
    │   ├── FiltersBar.tsx
    │   └── hooks/
    │       ├── useEvaluations.ts          ← list with filters
    │       ├── useEvaluation.ts           ← single by id
    │       ├── useCreateEvaluation.ts
    │       ├── useUpdateEvaluation.ts
    │       └── useDeleteEvaluation.ts
    ├── components/
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   ├── Select.tsx
    │   ├── Modal.tsx
    │   ├── Toast.tsx
    │   ├── LoadingSpinner.tsx
    │   └── ErrorBoundary.tsx
    └── tests/
        ├── EvaluationForm.test.tsx
        └── EvaluationsListPage.test.tsx
```

### 7.2 Routes

| Path | Component | Protected |
|---|---|---|
| `/login` | `LoginPage` | no |
| `/signup` | `SignupPage` | no |
| `/` | redirect → `/evaluations` | – |
| `/evaluations` | `EvaluationsListPage` | yes |
| `/evaluations/new` | `EvaluationFormPage` (create mode) | yes |
| `/evaluations/:id/edit` | `EvaluationFormPage` (edit mode) | yes |
| `*` | `NotFoundPage` | – |

### 7.3 Axios refresh interceptor (pseudocode)

```typescript
// lib/api.ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true });

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status !== 401 || error.config._retry) throw error;
    error.config._retry = true;
    refreshPromise ??= api.post('/auth/refresh').finally(() => { refreshPromise = null; });
    await refreshPromise;
    return api(error.config);
  }
);
```

### 7.4 List page UX
- Table: title, courseId, dueDate, status (color-coded badge), actions (edit, delete)
- Top bar: status filter (select), courseId filter (text input), "New evaluation" button
- Empty state: friendly illustration + "Create your first evaluation" CTA
- Loading: skeleton rows
- Error: inline retry banner
- Delete: confirmation modal with "Type DELETE to confirm" pattern (or just button)
- Pagination: "Load more" button using cursor

### 7.5 Form page UX
- Same component for create/edit (passes `mode` prop)
- Fields: title, description (textarea), courseId, dueDate (datetime-local), status (select)
- Validation: react-hook-form + zodResolver, inline errors
- Submit: optimistic update via TanStack Query mutation, toast on success/error
- Cancel: back to list

---

## 8. Deployment Topology

### 8.1 SAM template structure (`template.yaml`)

Resources defined:
- `Api` — `AWS::Serverless::HttpApi` with throttling
- `EvaluationsFunction` — `AWS::Serverless::Function` (Node 20, 512 MB, 10s timeout) with events for all routes
- `EvaluationsTable` — `AWS::DynamoDB::Table` with GSI
- `UsersTable` — `AWS::DynamoDB::Table`
- `JwtSecret` — `AWS::SecretsManager::Secret` (auto-generated)

Outputs:
- `ApiUrl` — used by CloudFront origin config

### 8.2 CloudFront stack (`infra/cloudfront-template.yaml`, separate SAM template)

Deployed AFTER the main backend stack (depends on `ApiUrl` output). Implemented as a second SAM template (consistent IaC across the project, no shell scripts for infra):

```bash
sam deploy -t infra/cloudfront-template.yaml \
  --stack-name avacom-cloudfront \
  --parameter-overrides ApiUrl=$(sam list stack-outputs --stack-name avacom --output json | jq -r '.[] | select(.OutputKey=="ApiUrl") | .OutputValue')
```

Resources:
- `WebBucket` — S3 private bucket (Block Public Access ON)
- `OriginAccessControl` — OAC for S3 access from CloudFront only
- `WebBucketPolicy` — allow `s3:GetObject` from CloudFront via OAC
- `Distribution` with 2 cache behaviors:
  - Default `/*` → S3 origin (cache long for `assets/*`, no-cache for `*.html`)
  - `/api/*` → API Gateway origin (no cache, forward cookies + `Authorization` header, OPTIONS allowed)
- `SecurityHeadersPolicy` — HSTS, CSP, X-Frame-Options, Referrer-Policy

### 8.3 Deploy commands

```bash
# Backend (one-time setup)
cd backend
npm install
npm run build                                    # esbuild bundles to dist/
sam deploy --guided                              # interactive first time
sam deploy                                       # subsequent deploys

# Frontend (after backend exists)
cd ../frontend
npm install
npm run build                                    # vite build → dist/
aws s3 sync dist/ s3://$BUCKET --delete
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID --paths "/*"
```

### 8.4 Local development

```bash
# Backend
cd backend
sam local start-api --env-vars env.json          # Lambda in Docker, port 3000

# Frontend
cd frontend
npm run dev                                       # Vite dev server, port 5173
# vite.config.ts proxies /api → http://localhost:3000
```

---

## 9. Testing Strategy — Target ≥90% Coverage

Coverage measured by `@vitest/coverage-v8` (V8 native, fastest). CI fails if statements/branches/functions/lines fall below 90% on either backend or frontend.

### 9.1 Backend tests

**Two layers:**

| Layer | Tool | What it tests | Mocking |
|---|---|---|---|
| **Unit** | Vitest | Use cases, mappers, entity factories, middleware logic | Mocked port interfaces (no AWS) |
| **Integration** | Vitest + DynamoDB Local (Docker) | Adapters, HTTP routes end-to-end through real Hono + real DDB Local | Real DynamoDB Local container |

**Test file layout:**

```
backend/src/
├── domain/
│   ├── evaluation/__tests__/
│   │   └── Evaluation.test.ts                    ← factory, invariants
│   ├── user/__tests__/
│   │   └── User.test.ts
│   └── use-cases/__tests__/
│       ├── signUp.test.ts                        ← 5 cases: happy, duplicate email, weak password, normalizes email, hashes password
│       ├── login.test.ts                         ← 4 cases: happy, user not found, bad password, generic error message
│       ├── refreshToken.test.ts                  ← 3 cases: happy, expired refresh, invalid signature
│       ├── getCurrentUser.test.ts                ← 2 cases: happy, user not found
│       ├── createEvaluation.test.ts              ← 4 cases: happy, userId always from input not body, sets timestamps, validation
│       ├── getEvaluation.test.ts                 ← 4 cases: happy, not found, forbidden (other user's), soft-deleted hidden
│       ├── listEvaluations.test.ts               ← 6 cases: happy, filter by status, filter by courseId, pagination cursor, ownership scope, excludes soft-deleted
│       ├── updateEvaluation.test.ts              ← 5 cases: happy, not found, forbidden, soft-deleted, partial update preserves fields
│       └── deleteEvaluation.test.ts              ← 4 cases: happy soft delete, not found, forbidden, idempotent on already-deleted
├── adapters/
│   ├── persistence/__tests__/
│   │   ├── DynamoEvaluationRepository.integration.test.ts   ← real DDB Local: save, findById, query GSI, update, soft delete, pagination
│   │   └── DynamoUserRepository.integration.test.ts         ← real DDB Local: save unique email, findByEmail, conditional check
│   └── auth/__tests__/
│       └── JwtTokenService.test.ts                          ← sign+verify roundtrip, expired token rejected, bad signature rejected
└── http/
    ├── __tests__/
    │   ├── app.integration.test.ts                          ← full HTTP through Hono + real DDB Local: signup→login→create→list→update→delete
    │   ├── auth.routes.integration.test.ts                  ← signup conflicts, login flows, refresh, logout cookie clearing
    │   ├── evaluations.routes.integration.test.ts           ← all CRUD endpoints with auth cookies
    │   └── health.routes.test.ts                            ← /api/health responds
    ├── middleware/__tests__/
    │   ├── authMiddleware.test.ts                           ← 6 cases: valid token, missing cookie, expired, malformed, bad signature, sets userId
    │   └── errorHandler.test.ts                             ← maps each DomainError → correct HTTP code + body
    ├── schemas.test.ts                                      ← Zod schemas: each field validation rule
    └── mappers.test.ts                                      ← domain ↔ DTO roundtrip
```

**Expected test count:** ~55 backend tests

**Integration tests setup:**
- `vitest.config.ts` defines two projects: `unit` (default, no Docker) and `integration` (requires DynamoDB Local)
- `npm run test` → unit only (fast, ~2s)
- `npm run test:integration` → spins up DynamoDB Local via Docker Compose, creates tables, runs integration suite
- `npm run test:all` → both
- CI runs `test:all` with coverage; coverage thresholds enforced

**Coverage exclusions** (in `vitest.config.ts`):
- `composition.ts` (DI wiring; covered indirectly by integration tests)
- `handler.ts` (Lambda entry; covered by integration tests)
- `**/*.types.ts`, `**/index.ts` re-exports
- `template.yaml`, configs

### 9.2 Frontend tests

**Two layers:**

| Layer | Tool | What it tests | Mocking |
|---|---|---|---|
| **Component/Hook** | Vitest + Testing Library | Pages, components, hooks in isolation | Mocked TanStack Query, mocked AuthContext |
| **Integration** | Vitest + Testing Library + MSW | Full flows from page render to API response | MSW (Mock Service Worker) intercepts HTTP |

**Test file layout:**

```
frontend/src/
├── auth/__tests__/
│   ├── LoginPage.test.tsx                ← renders, validates email, submits, shows error on 401, redirects on success
│   ├── SignupPage.test.tsx               ← same patterns for signup
│   ├── ProtectedRoute.test.tsx           ← redirects unauth'd to /login, renders children when authed
│   └── AuthProvider.test.tsx             ← context provides user, login mutation, logout clears cache
├── evaluations/__tests__/
│   ├── EvaluationsListPage.test.tsx      ← loading state, empty state, populated rows, filter triggers refetch, pagination loads more, delete opens dialog
│   ├── EvaluationFormPage.test.tsx       ← create mode submits POST, edit mode pre-fills, submits PUT
│   ├── EvaluationForm.test.tsx           ← all validation rules, submit calls onSubmit prop with right shape
│   ├── EvaluationsTable.test.tsx         ← renders columns, status badge color, edit + delete buttons
│   ├── DeleteConfirmDialog.test.tsx      ← opens, confirm calls onConfirm, cancel closes
│   ├── FiltersBar.test.tsx               ← status + courseId inputs emit changes
│   └── hooks/__tests__/
│       ├── useEvaluations.test.tsx       ← queries with filters, sets stale time, refetches on focus
│       ├── useEvaluation.test.tsx
│       ├── useCreateEvaluation.test.tsx  ← invalidates list on success, shows toast
│       ├── useUpdateEvaluation.test.tsx
│       └── useDeleteEvaluation.test.tsx
├── components/__tests__/
│   ├── Button.test.tsx                   ← variants, disabled, loading, click handler
│   ├── Input.test.tsx                    ← label, error display, onChange
│   ├── Select.test.tsx
│   ├── Modal.test.tsx                    ← opens, closes on backdrop, ESC, focus trap
│   ├── Toast.test.tsx
│   └── ErrorBoundary.test.tsx            ← catches error, renders fallback
├── lib/__tests__/
│   ├── api.interceptor.test.ts           ← 401 triggers refresh, retries original, single-flight on concurrent 401s, logs out on refresh failure
│   └── queryClient.test.ts               ← default options
└── __tests__/
    └── integration/
        ├── signup-create-flow.test.tsx   ← MSW: full flow from signup to creating first evaluation
        ├── login-list-filter.test.tsx    ← MSW: login, see list, apply filter
        └── edit-delete-flow.test.tsx     ← MSW: edit an evaluation, then delete it
```

**Expected test count:** ~40 frontend tests

**Coverage exclusions:**
- `main.tsx` (root render)
- `vite-env.d.ts`, type-only files
- Story files if added

### 9.3 Coverage configuration

```typescript
// vitest.config.ts (both backend and frontend)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.*',
        '**/*.types.ts',
        'src/main.tsx',
        'src/composition.ts',
        'src/handler.ts',
      ],
    },
  },
});
```

### 9.4 CI gate (GitHub Actions)

```yaml
# .github/workflows/test.yml (excerpt)
- name: Backend tests with coverage
  working-directory: backend
  run: npm run test:all -- --coverage

- name: Frontend tests with coverage
  working-directory: frontend
  run: npm run test -- --coverage

- name: Upload coverage to artifact
  uses: actions/upload-artifact@v4
  with:
    name: coverage-report
    path: |
      backend/coverage/
      frontend/coverage/
```

If coverage falls below 90% on any of statements / branches / functions / lines, the build fails. PRs cannot merge without passing coverage.

### 9.5 Manual smoke test (post-deploy)

```bash
BASE=https://d1xxx.cloudfront.net

# Health
curl $BASE/api/health

# Signup → cookies stored
curl -c cookies.txt -X POST $BASE/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@avacom.com","password":"password123","name":"Test"}'

# Create evaluation
curl -b cookies.txt -X POST $BASE/api/evaluations \
  -H 'Content-Type: application/json' \
  -d '{"courseId":"CS101","title":"Midterm","description":"...","dueDate":"2026-06-01T12:00:00Z","status":"active"}'

# List
curl -b cookies.txt $BASE/api/evaluations

# Filter
curl -b cookies.txt "$BASE/api/evaluations?status=active"
```

### 9.6 Test pyramid summary

```
       /\
      /  \      ~5 integration tests (frontend MSW + backend HTTP)
     /----\
    /      \    ~15 adapter/route integration tests (backend with DDB Local)
   /--------\
  /          \  ~75 unit tests (domain, hooks, components)
 /____________\
```

Total: **~95 tests**, with the bulk in fast unit tests at the base. Integration tests catch wiring bugs the unit tests can't.

---

## 10. Time Budget

| Phase | Tasks | Est. |
|---|---|---|
| **Phase 0: Setup** | Repo init, backend scaffold, frontend scaffold, SAM init, install deps, Docker Compose for DDB Local | 60 min |
| **Phase 1: Backend domain** | Entities, ports, all 9 use cases, errors | 75 min |
| **Phase 2: Backend adapters** | DynamoDB repos, JwtTokenService | 45 min |
| **Phase 3: Backend HTTP** | Hono routes, schemas, middleware (auth, error, logger), composition | 60 min |
| **Phase 4: Backend unit tests** | ~30 unit tests on use cases, mappers, middleware, schemas | 90 min |
| **Phase 5: Backend integration tests** | ~25 integration tests on adapters + HTTP routes with DDB Local | 75 min |
| **Phase 6: SAM deploy** | template.yaml, sam deploy, smoke test endpoints | 30 min |
| **Phase 7: Frontend foundation** | Vite + Tailwind setup, routing, AuthProvider, axios interceptor | 45 min |
| **Phase 8: Frontend auth pages** | LoginPage, SignupPage, ProtectedRoute | 30 min |
| **Phase 9: Frontend evaluations** | List page (table, filters, pagination, delete dialog), Form page (create/edit) | 75 min |
| **Phase 10: Frontend component + hook tests** | ~30 tests on components, hooks, atoms | 90 min |
| **Phase 11: Frontend integration tests** | ~10 tests with MSW for full flows + interceptor | 45 min |
| **Phase 12: CloudFront + deploy** | Bucket, distribution, OAC, second SAM template, deploy script, validate | 45 min |
| **Phase 13: CI setup** | GitHub Actions workflow for tests + coverage gate | 20 min |
| **Phase 14: Polish + README** | Loading/error states pass, README with diagrams linked, `.env.example`, screenshots | 40 min |
| **Total** | | **~13 hrs** |

> The 4hr enunciado estimate assumes a much narrower scope (likely no auth, single-table, manual deploy, minimal tests). This plan reflects "hagámoslo bien" per user direction — production-grade auth with stateless JWT, hexagonal architecture, 90% test coverage, and CI. **Recommended: split into 3 sessions** (backend with tests deployed first, frontend with tests second, CI + polish third). Total ~13 hrs across the sessions.

---

## 11. Live Demo Preparation

### 11.1 Likely "in-vivo" change requests
| Request | Files touched | Time |
|---|---|---|
| Add new validation (e.g., title min 10 chars) | `http/schemas.ts` | 30s |
| Add enum value (e.g., status `draft`) | `http/schemas.ts` + `EvaluationForm.tsx` (select) | 2 min |
| Add filter (e.g., `?priority=high`) | `domain/use-cases/listEvaluations.ts` + repo query | 5 min |
| Add field (e.g., `priority`) | `Evaluation.ts` + `schemas.ts` + form + table column | 8 min |
| Change error message | `http/middleware/errorHandler.ts` | 30s |
| Add endpoint (e.g., bulk archive) | `routes/evaluations.routes.ts` + new use case file | 10 min |

### 11.2 Demo script (10 min)
1. **Open CloudFront URL** → show login page
2. **Sign up** new user → land on empty evaluations page
3. **Create** evaluation → show optimistic update
4. **Edit** the evaluation → show pre-filled form
5. **Filter** by status → show TanStack Query refetch
6. **Delete** with confirmation → show soft delete
7. **Open CloudWatch Logs** → show structured JSON with correlationId
8. **Open DynamoDB console** → show the items
9. **Walk through hexagonal layout** in editor (60s)

---

## 12. Out of Scope (explicit)

To prevent scope creep mid-build:

- ❌ Password reset / email verification
- ❌ Email notifications
- ❌ Role-based access (admin vs user)
- ❌ Audit log table
- ❌ Multi-region / global tables
- ❌ Refresh token revocation (decision 2.6)
- ❌ Single-table DynamoDB design (decision 2.9)
- ❌ Cognito / OAuth providers
- ❌ Real-time updates (websockets)
- ❌ File uploads
- ❌ Internationalization (i18n)
- ❌ Dark mode (only if time permits)

If reviewer asks about any of these, the answer is: *"Out of scope for the test; would add in production by [brief approach]."*

---

## 13. Deliverables Checklist

- [ ] GitHub private repo with `/backend`, `/frontend`, `/docs`, `README.md`
- [ ] README: architecture diagram, setup instructions, deploy instructions, env vars, API documentation
- [ ] Deployed CloudFront URL working end-to-end
- [ ] `REACT_APP_API_URL` (or `VITE_API_URL`) properly configured
- [ ] Significant git commits with conventional commit messages
- [ ] Backend tests passing (`npm test`)
- [ ] Frontend tests passing (`npm test`)
- [ ] CloudWatch logs visible with structured JSON
- [ ] Demo script rehearsed (under 10 min)
