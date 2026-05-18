# AVACOM Backend

Single Lambda + DynamoDB API for the AVACOM evaluations system.
Architecture: hexagonal (ports & adapters). See [docs/diagrams/](../docs/diagrams/).

## Architecture quick links

- [System architecture](../docs/diagrams/01-system-architecture.md)
- [Hexagonal layout](../docs/diagrams/02-hexagonal-architecture.md)
- [Auth flow sequences](../docs/diagrams/03-auth-flow-sequence.md)
- [CRUD request lifecycle](../docs/diagrams/04-crud-request-lifecycle.md)
- [Data model](../docs/diagrams/05-data-model.md)
- [Full spec](../docs/superpowers/specs/2026-05-17-avacom-fullstack-design.md)

## Prerequisites

- Node.js 20+
- Docker (for DynamoDB Local integration tests)
- AWS SAM CLI
- AWS CLI configured (`aws configure`)
- AWS account with admin/deploy permissions

## Setup

```bash
npm install
```

## Local development

```bash
# Start DynamoDB Local for integration tests
npm run ddb:up

# Run unit tests (fast, no Docker)
npm test

# Run integration tests (requires DDB Local)
npm run test:integration

# Run everything with coverage gate
npm run test:coverage

# SAM Local API (Lambda in Docker on port 3000)
npm run dev
```

## Deploy

```bash
npm run deploy:guided   # first time, interactive
npm run deploy          # subsequent deploys
```

After deploy, the API URL is printed and stored in CloudFormation outputs:

```bash
sam list stack-outputs --stack-name avacom --output json | jq
```

## Environment variables (Lambda)

| Var | Source | Example |
|---|---|---|
| `EVALUATIONS_TABLE` | CloudFormation | `avacom-evaluations-prod` |
| `USERS_TABLE` | CloudFormation | `avacom-users-prod` |
| `JWT_SECRET` | Secrets Manager (auto-generated, 64 chars) | – |
| `APP_VERSION` | hardcoded in template | `1.0.0` |

## API contract

See [full spec § 6 API Contract](../docs/superpowers/specs/2026-05-17-avacom-fullstack-design.md#6-api-contract).

## Project layout

```
src/
├── domain/         pure business logic — no AWS, no HTTP
├── adapters/       implementations of ports — DynamoDB, JWT, bcrypt
├── http/           Hono routes, middleware, Zod schemas
├── composition.ts  dependency injection root
└── handler.ts      Lambda entry
```

ESLint blocks `domain/*` from importing `adapters/*`, `http/*`, or AWS SDK directly.
