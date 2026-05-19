# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

Two-package monorepo (no workspace tool — each package is independent):

- `backend/` — single AWS Lambda (Node 22 + Hono) backed by three DynamoDB tables, deployed via AWS SAM. Hexagonal architecture, structurally enforced by ESLint.
- `frontend/` — React 19 + Vite 8 + Tailwind SPA, deployed to S3 behind CloudFront. The same CloudFront distribution proxies `/api/*` to API Gateway, so the deployed app has no CORS surface.
- `infra/` — CloudFront stack (`cloudfront-template.yaml`) and bash deploy scripts. Backend infra lives in `backend/template.yaml`.
- `docs/superpowers/specs/2026-05-17-avacom-fullstack-design.md` — canonical spec. Treat it as the source of truth when behavior is ambiguous; cross-reference it before making non-trivial design decisions.
- `docs/diagrams/` — Mermaid diagrams for system, hexagonal layout, auth flow, CRUD lifecycle, data model, frontend tree.

## Common commands

Run from the relevant package directory.

### Backend (`backend/`)

| Task | Command | Notes |
|---|---|---|
| Unit tests | `npm test` | Vitest `unit` project, no Docker needed. |
| Integration tests | `npm run test:integration` | Requires `npm run ddb:up` first (DynamoDB Local in Docker). Runs serially (`fileParallelism: false`). |
| All tests + coverage gate | `npm run test:coverage` | 90% threshold on statements/branches/functions/lines. |
| Single test file | `npx vitest run path/to/file.test.ts` | Or `-t "test name"` to filter by name. |
| Lint | `npm run lint` | |
| Typecheck | `npm run typecheck` | |
| Local API | `npm run dev` | SAM Local on port 3000, reads `env.local.json`. |
| Deploy | `npm run deploy` (or `deploy:guided` first time) | Runs esbuild bundle → `sam deploy`. |
| DDB Local | `npm run ddb:up` / `ddb:down` | |

### Frontend (`frontend/`)

| Task | Command |
|---|---|
| Dev server | `npm run dev` (Vite on `:5173`, proxies `/api` → `:3000`) |
| Build | `npm run build` (runs `tsc -b` then `vite build`) |
| Tests | `npm test` (Vitest + jsdom + MSW; same 90% coverage gate) |
| Lint | `npm run lint` |

### Local dev quick start

Run all of these from the repo root, in separate terminals:

```bash
# 1. DDB Local (Docker)
cd backend && npm run ddb:up

# 2. Create the three local tables (idempotent — safe to re-run)
cd backend && npm run ddb:init

# 3. esbuild watch (rebuilds dist/ on every src change)
cd backend && npm run build:watch

# 4. SAM Local API on :3000 (reads dist/, env.local.json)
cd backend && npm run dev

# 5. Vite on :5173 (proxies /api → :3000)
cd frontend && npm run dev
```

Then open `http://localhost:5173`. Frontend HMR is automatic; backend changes take effect on the next request (SAM Local cold-starts the Lambda per request).

**Cross-platform notes**:

- **Windows + Intel Mac (x86_64)**: works out of the box. The `dev` script already passes `--parameter-overrides LambdaArchitecture=x86_64` because Docker Desktop on x86 hosts can't emulate arm64 Lambda images reliably.
- **Apple Silicon Mac (M1/M2/M3, arm64)**: also works — the x86_64 Lambda image runs under Rosetta 2, ~200ms slower per cold start but functionally identical. For native arm64 speed, override the dev script: `sam local start-api --env-vars env.local.json --parameter-overrides LambdaArchitecture=arm64 --docker-network avacom-net`. Don't change the npm-script default; prod deploy uses the same template and arm64 is the prod default already.
- Both architectures land on the same `avacom-net` Docker network, so the Lambda container reaches DDB Local at the hostname `avacom-ddb-local`.

**Local-only env vars** (`backend/env.local.json`):

- `DDB_ENDPOINT=http://avacom-ddb-local:8000` — routes the AWS SDK to the local container. Empty in prod, so the SDK uses the real DDB endpoint.
- `COOKIE_SECURE=false` — drops the `Secure` flag from auth cookies so they persist on `http://localhost`. Prod default is `true`.
- Both variables are declared in `template.yaml` under `Globals.Function.Environment.Variables`; SAM Local only honors env overrides for variables already declared in the template.

### Full deploy from repo root

```bash
cd backend && npm run deploy
cd .. && bash infra/deploy-cloudfront.sh   # one-time
bash infra/deploy-frontend.sh              # builds, syncs S3, invalidates CloudFront
```

## Backend architecture

Hexagonal (ports & adapters). The composition root wires concrete adapters to the Hono app; `handler.ts` is a 5-line Lambda entry that calls `composeApp()`.

```
src/
├── domain/         pure business logic — entities, repository ports, use-cases
├── adapters/       DynamoDB repos, JWT (jose), bcrypt
├── http/           Hono routes, middleware, Zod schemas
├── composition.ts  DI root — instantiates adapters and calls buildApp(deps)
└── handler.ts      hono/aws-lambda handler
```

**Hexagonal boundary is enforced by `.eslintrc.cjs`.** `src/domain/**` cannot import from `adapters/`, `http/`, `@aws-sdk/*`, `@aws-lambda-powertools/*`, `hono`, `bcryptjs`, `jose`, HTTP clients, DB drivers, or Node `fs`/`net`/`http`. Use a port (interface in `domain/`) and pass the adapter in via `composition.ts`. If you need to violate this, fix the design, don't disable the rule.

**Use cases are factories**: each file in `domain/use-cases/` exports a function `(deps) => (input) => result`. Routes call `useCase(deps)({...})`. This keeps domain logic free of framework concerns and trivially mockable.

**Auth model**: JWT access token (15m) + refresh token (7d), both in httpOnly cookies. `JwtTokenService` uses `jose`. Secret is generated by CloudFormation into Secrets Manager and injected into the Lambda via `{{resolve:secretsmanager:...}}`. The `authMiddleware` populates `c.var.userId` / `c.var.userEmail` for downstream handlers.

**Data model** (3 tables, `PAY_PER_REQUEST`):
- `EvaluationsTable` — PK `evaluationId`, GSI `userId-createdAt-index` for per-user listing (sorted by createdAt).
- `UsersTable` — PK `email`.
- `CoursesTable` — PK `courseId`.

**Lambda**: `nodejs22.x`, arm64 in prod (x86_64 in local SAM), 512MB, Tracing Active. Architecture is exposed as the `LambdaArchitecture` CloudFormation parameter (default `arm64`). Bundled by `esbuild.config.mjs` into `dist/`. HttpApi has a single `ANY /{proxy+}` route — all routing happens inside Hono.

## Frontend architecture

- **Routing**: `react-router-dom` v7. `ProtectedRoute` gates everything except `/login` and `/signup`. Wrapped by `AuthProvider` → `QueryClientProvider` → `ToastProvider` → `ErrorBoundary` (see `App.tsx`).
- **Data layer**: TanStack Query for server state. All query/mutation hooks live alongside their feature (`evaluations/hooks/use*.ts`). Default `staleTime: 30s`, `retry: 1`.
- **HTTP**: `lib/api.ts` is the single axios instance. `withCredentials: true` so cookies travel. The response interceptor handles 401 by calling `/api/auth/refresh` once (deduplicated via shared `refreshPromise`) and retrying the original request. Auth-path 401s are not retried.
- **Forms**: `react-hook-form` + Zod via `@hookform/resolvers`. Schemas live in `lib/schemas.ts` and feature-local `types.ts`.
- **Testing**: Vitest + jsdom + Testing Library + MSW. Setup file `src/__tests__/setup.ts`.
- **Bundle splitting**: `vite.config.ts` manual chunks separate `react-vendor`, `query-vendor`, `form-vendor`.

## Conventions to preserve

- **Don't bypass the hexagonal ESLint rule.** If a domain file needs new capability, define a port interface in `domain/`, implement it in `adapters/`, wire it in `composition.ts`.
- **Don't drop the 90% coverage gate** on either side — `test:coverage` is run in CI.
- **Integration tests are serial and need DDB Local** (`fileParallelism: false`, `setup-integration.ts`). Don't run them in CI without the container.
- **The deployed frontend has no separate API origin** — it talks to `/api/*` which CloudFront proxies. Don't introduce CORS code paths for prod; only the Vite dev proxy needs to bridge `:5173` → `:3000`.
- **Cookies are httpOnly** — there is no token in JS-accessible storage. Don't add one; the refresh-interceptor pattern is the contract.
- **Cookie security flags are env-driven.** `buildCookie()` in `backend/src/http/cookies.ts` reads `COOKIE_SECURE` at runtime and uses `SameSite=Lax`. Don't reintroduce `SameSite=Strict` (breaks first-load UX on external links) or hard-code `Secure` (breaks local HTTP). Local dev sets `COOKIE_SECURE=false`; prod keeps the default `true`.
- **Don't switch the prod Lambda architecture** without checking AWS Lambda pricing — arm64 is ~20% cheaper than x86_64 and the template defaults to it for that reason.

## When in doubt

Read the spec (`docs/superpowers/specs/2026-05-17-avacom-fullstack-design.md`) — § 2 documents every architectural decision with a Q&A defense, and § 6 is the API contract.
