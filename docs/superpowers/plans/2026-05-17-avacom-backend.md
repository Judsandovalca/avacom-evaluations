# AVACOM Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade serverless evaluation management API on AWS with hexagonal architecture, JWT auth, and ≥90% test coverage.

**Architecture:** Single AWS Lambda (Node 20 + TypeScript + Hono) following hexagonal architecture (ports & adapters). Domain is pure with no AWS imports. Two DynamoDB tables (Users, Evaluations) with one GSI. Stateless JWT auth via httpOnly cookies. Deployed via AWS SAM.

**Tech Stack:** Node.js 20, TypeScript 5, Hono, Zod, jose (JWT), bcryptjs, @aws-sdk/client-dynamodb v3, @aws-lambda-powertools/logger, AWS SAM, Vitest, aws-sdk-client-mock, DynamoDB Local (Docker).

**Spec reference:** [`../specs/2026-05-17-avacom-fullstack-design.md`](../specs/2026-05-17-avacom-fullstack-design.md)
**Diagrams reference:** [`../../diagrams/README.md`](../../diagrams/README.md)

---

## Phase 0: Project Setup

### Task 0.1: Initialize backend folder and Git repo

**Files:**
- Create: `backend/.gitignore`
- Create: `backend/README.md`
- Modify: repo root (init git if needed)

- [ ] **Step 1: Initialize Git repo if not exists**

```bash
cd /c/Users/User/Desktop/avacomProjecto
git init -b main
```

- [ ] **Step 2: Create backend folder and enter it**

```bash
mkdir -p backend
cd backend
```

- [ ] **Step 3: Create `.gitignore`**

```gitignore
node_modules/
dist/
.aws-sam/
coverage/
.env
.env.local
*.log
.DS_Store
samconfig.toml.user
```

- [ ] **Step 4: Create `README.md` placeholder**

```markdown
# AVACOM Backend

See `../docs/superpowers/specs/2026-05-17-avacom-fullstack-design.md` for full spec.

## Quick start
\`\`\`bash
npm install
npm run dev          # SAM Local API
npm test             # unit tests
npm run test:all     # unit + integration (requires Docker)
\`\`\`
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore README.md
git commit -m "chore(backend): initialize folder and gitignore"
```

---

### Task 0.2: Initialize `package.json` and TypeScript

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "avacom-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node esbuild.config.mjs",
    "dev": "sam local start-api --env-vars env.local.json",
    "deploy": "npm run build && sam deploy",
    "deploy:guided": "npm run build && sam deploy --guided",
    "test": "vitest run --project unit",
    "test:integration": "vitest run --project integration",
    "test:all": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --project unit",
    "lint": "eslint 'src/**/*.ts'",
    "typecheck": "tsc --noEmit",
    "ddb:up": "docker compose up -d",
    "ddb:down": "docker compose down"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    "noEmit": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "vitest.config.ts", "esbuild.config.mjs"],
  "exclude": ["node_modules", "dist", ".aws-sam"]
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json tsconfig.json
git commit -m "chore(backend): add package.json and tsconfig"
```

---

### Task 0.3: Install dependencies

**Files:**
- Modify: `backend/package.json` (npm adds deps)
- Create: `backend/package-lock.json`

- [ ] **Step 1: Install production dependencies**

```bash
cd backend
npm install hono @hono/zod-validator zod jose bcryptjs \
  @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/util-dynamodb \
  @aws-lambda-powertools/logger @aws-lambda-powertools/metrics @aws-lambda-powertools/tracer
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D typescript @types/node @types/bcryptjs @types/aws-lambda \
  vitest @vitest/coverage-v8 aws-sdk-client-mock \
  esbuild eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-import
```

- [ ] **Step 3: Verify installations**

```bash
npm list --depth=0
```

Expected: see all packages installed with versions, no UNMET DEPENDENCY warnings.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(backend): install dependencies"
```

---

### Task 0.4: Configure Vitest with coverage gates and dual projects

**Files:**
- Create: `backend/vitest.config.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.integration.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.integration.test.ts'],
          setupFiles: ['./src/__tests__/setup-integration.ts'],
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.integration.test.ts',
        '**/*.config.*',
        'src/main.ts',
        'src/handler.ts',
        'src/composition.ts',
        'src/**/__tests__/setup-*.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
```

- [ ] **Step 2: Verify Vitest can resolve config**

```bash
npx vitest --version
npx vitest list
```

Expected: prints version + lists "No tests found" (no test files exist yet — that's OK).

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore(backend): configure Vitest with 90% coverage gates"
```

---

### Task 0.5: Configure ESLint with hexagonal import rule

**Files:**
- Create: `backend/.eslintrc.cjs`

- [ ] **Step 1: Create `.eslintrc.cjs`**

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-restricted-imports': 'off',
    '@typescript-eslint/no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['**/adapters/**', '**/http/**', '@aws-sdk/*', '@aws-lambda-powertools/*'],
          message: 'Domain layer cannot import from adapters, http, or AWS SDK.',
        },
      ],
    }],
  },
  overrides: [
    {
      files: ['src/domain/**/*.ts'],
      rules: {
        // Hexagonal: domain must not import infrastructure
        '@typescript-eslint/no-restricted-imports': ['error', {
          patterns: [
            { group: ['**/adapters/**'], message: 'Domain cannot import adapters.' },
            { group: ['**/http/**'], message: 'Domain cannot import http layer.' },
            { group: ['@aws-sdk/*'], message: 'Domain cannot import AWS SDK directly.' },
            { group: ['@aws-lambda-powertools/*'], message: 'Domain cannot import Powertools directly.' },
            { group: ['hono', 'hono/*'], message: 'Domain cannot import Hono.' },
          ],
        }],
      },
    },
    {
      files: ['**/*.test.ts', '**/*.integration.test.ts'],
      rules: {
        '@typescript-eslint/no-restricted-imports': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '.aws-sam/', 'coverage/'],
};
```

- [ ] **Step 2: Verify ESLint runs**

```bash
npm run lint
```

Expected: no errors (no source files yet).

- [ ] **Step 3: Commit**

```bash
git add .eslintrc.cjs
git commit -m "chore(backend): add ESLint with hexagonal import enforcement"
```

---

### Task 0.6: Configure Docker Compose for DynamoDB Local

**Files:**
- Create: `backend/docker-compose.yml`
- Create: `backend/src/__tests__/setup-integration.ts`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  dynamodb-local:
    image: amazon/dynamodb-local:2.5.2
    container_name: avacom-ddb-local
    ports:
      - "8000:8000"
    command: -jar DynamoDBLocal.jar -sharedDb -inMemory
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:8000 | grep -q 'DynamoDB Local'"]
      interval: 5s
      timeout: 3s
      retries: 5
```

- [ ] **Step 2: Create integration test setup**

```typescript
// src/__tests__/setup-integration.ts
import { beforeAll, afterAll } from 'vitest';
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb';

export const TEST_EVALUATIONS_TABLE = 'test-Evaluations';
export const TEST_USERS_TABLE = 'test-Users';

export const ddbClient = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' },
});

async function createEvaluationsTable() {
  await ddbClient.send(new CreateTableCommand({
    TableName: TEST_EVALUATIONS_TABLE,
    AttributeDefinitions: [
      { AttributeName: 'evaluationId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'evaluationId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [{
      IndexName: 'userId-createdAt-index',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  }));
}

async function createUsersTable() {
  await ddbClient.send(new CreateTableCommand({
    TableName: TEST_USERS_TABLE,
    AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  }));
}

async function dropTables() {
  for (const name of [TEST_EVALUATIONS_TABLE, TEST_USERS_TABLE]) {
    try { await ddbClient.send(new DeleteTableCommand({ TableName: name })); }
    catch { /* not exist */ }
  }
}

beforeAll(async () => {
  await dropTables();
  await createEvaluationsTable();
  await createUsersTable();
});

afterAll(async () => {
  await dropTables();
});
```

- [ ] **Step 3: Verify Docker Compose starts cleanly**

```bash
npm run ddb:up
sleep 3
curl -s http://localhost:8000 | head -1
npm run ddb:down
```

Expected: curl returns HTML containing "DynamoDB Local"; `ddb:down` removes the container.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml src/__tests__/setup-integration.ts
git commit -m "chore(backend): add DynamoDB Local for integration tests"
```

---

## Phase 1: Domain — Entities and Errors

### Task 1.1: Create `Evaluation` entity with TDD

**Files:**
- Create: `backend/src/domain/evaluation/Evaluation.ts`
- Create: `backend/src/domain/evaluation/__tests__/Evaluation.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/domain/evaluation/__tests__/Evaluation.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Evaluation } from '../Evaluation';

describe('Evaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T10:00:00.000Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('create() generates a UUID, sets timestamps, and defaults deletedAt to null', () => {
    const e = Evaluation.create({
      userId: 'u-1',
      courseId: 'CS101',
      title: 'Midterm',
      description: 'Chapter 1-5',
      dueDate: '2026-06-01T12:00:00.000Z',
      status: 'active',
    });

    expect(e.evaluationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(e.userId).toBe('u-1');
    expect(e.title).toBe('Midterm');
    expect(e.createdAt).toBe('2026-05-17T10:00:00.000Z');
    expect(e.updatedAt).toBe('2026-05-17T10:00:00.000Z');
    expect(e.deletedAt).toBeNull();
  });

  it('applyPatch() updates only provided fields and bumps updatedAt', () => {
    const original = Evaluation.create({
      userId: 'u-1', courseId: 'CS101', title: 'Old', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });

    vi.setSystemTime(new Date('2026-05-17T11:00:00.000Z'));
    const updated = Evaluation.applyPatch(original, { title: 'New', status: 'completed' });

    expect(updated.title).toBe('New');
    expect(updated.status).toBe('completed');
    expect(updated.description).toBe('d');
    expect(updated.createdAt).toBe(original.createdAt);
    expect(updated.updatedAt).toBe('2026-05-17T11:00:00.000Z');
    expect(updated.evaluationId).toBe(original.evaluationId);
  });

  it('softDelete() sets deletedAt and bumps updatedAt', () => {
    const e = Evaluation.create({
      userId: 'u-1', courseId: 'CS101', title: 't', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });

    vi.setSystemTime(new Date('2026-05-17T12:00:00.000Z'));
    const deleted = Evaluation.softDelete(e);

    expect(deleted.deletedAt).toBe('2026-05-17T12:00:00.000Z');
    expect(deleted.updatedAt).toBe('2026-05-17T12:00:00.000Z');
  });

  it('isDeleted() returns true if deletedAt is set', () => {
    const e = Evaluation.create({
      userId: 'u-1', courseId: 'CS101', title: 't', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });
    expect(Evaluation.isDeleted(e)).toBe(false);
    expect(Evaluation.isDeleted({ ...e, deletedAt: '2026-05-17T12:00:00.000Z' })).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run src/domain/evaluation/__tests__/Evaluation.test.ts
```

Expected: 4 failures, all citing "Cannot find module '../Evaluation'".

- [ ] **Step 3: Implement `Evaluation.ts`**

```typescript
// src/domain/evaluation/Evaluation.ts
import { randomUUID } from 'node:crypto';

export type EvaluationStatus = 'active' | 'completed' | 'cancelled';

export interface Evaluation {
  evaluationId: string;
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: EvaluationStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateEvaluationProps {
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: EvaluationStatus;
}

export type EvaluationPatch = Partial<Pick<
  Evaluation,
  'courseId' | 'title' | 'description' | 'dueDate' | 'status'
>>;

export const Evaluation = {
  create(props: CreateEvaluationProps): Evaluation {
    const now = new Date().toISOString();
    return {
      evaluationId: randomUUID(),
      userId: props.userId,
      courseId: props.courseId,
      title: props.title,
      description: props.description,
      dueDate: props.dueDate,
      status: props.status,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  },

  applyPatch(e: Evaluation, patch: EvaluationPatch): Evaluation {
    return { ...e, ...patch, updatedAt: new Date().toISOString() };
  },

  softDelete(e: Evaluation): Evaluation {
    const now = new Date().toISOString();
    return { ...e, deletedAt: now, updatedAt: now };
  },

  isDeleted(e: Evaluation): boolean {
    return e.deletedAt !== null;
  },
};
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/domain/evaluation/__tests__/Evaluation.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/domain/evaluation/
git commit -m "feat(domain): add Evaluation entity with create/patch/softDelete"
```

---

### Task 1.2: Create `User` entity with TDD

**Files:**
- Create: `backend/src/domain/user/User.ts`
- Create: `backend/src/domain/user/__tests__/User.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/domain/user/__tests__/User.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { User } from '../User';

describe('User', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T10:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('create() normalizes email to lowercase and trims, generates userId and timestamps', () => {
    const u = User.create({
      email: '  Test@AVACOM.com  ',
      passwordHash: 'hash$xxx',
      name: 'Test User',
    });
    expect(u.email).toBe('test@avacom.com');
    expect(u.userId).toMatch(/^[0-9a-f-]{36}$/);
    expect(u.passwordHash).toBe('hash$xxx');
    expect(u.name).toBe('Test User');
    expect(u.createdAt).toBe('2026-05-17T10:00:00.000Z');
  });

  it('toPublic() strips passwordHash', () => {
    const u = User.create({ email: 'a@b.com', passwordHash: 'secret', name: 'A' });
    const pub = User.toPublic(u);
    expect(pub).toEqual({ userId: u.userId, email: 'a@b.com', name: 'A' });
    expect((pub as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run src/domain/user/__tests__/User.test.ts
```

Expected: 2 failures, "Cannot find module '../User'".

- [ ] **Step 3: Implement `User.ts`**

```typescript
// src/domain/user/User.ts
import { randomUUID } from 'node:crypto';

export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface PublicUser {
  userId: string;
  email: string;
  name: string;
}

export interface CreateUserProps {
  email: string;
  passwordHash: string;
  name: string;
}

export const User = {
  create(props: CreateUserProps): User {
    return {
      userId: randomUUID(),
      email: props.email.trim().toLowerCase(),
      passwordHash: props.passwordHash,
      name: props.name,
      createdAt: new Date().toISOString(),
    };
  },

  toPublic(u: User): PublicUser {
    return { userId: u.userId, email: u.email, name: u.name };
  },
};
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/domain/user/__tests__/User.test.ts
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/domain/user/
git commit -m "feat(domain): add User entity with email normalization"
```

---

### Task 1.3: Create domain errors

**Files:**
- Create: `backend/src/domain/errors.ts`
- Create: `backend/src/domain/__tests__/errors.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/domain/__tests__/errors.test.ts
import { describe, it, expect } from 'vitest';
import {
  DomainError, ValidationError, NotFoundError, ForbiddenError,
  UnauthorizedError, ConflictError,
} from '../errors';

describe('domain errors', () => {
  it('DomainError captures code and message', () => {
    const e = new DomainError('TEST_CODE', 'msg');
    expect(e.code).toBe('TEST_CODE');
    expect(e.message).toBe('msg');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('DomainError');
  });

  it('subclasses set correct code and name', () => {
    expect(new ValidationError('bad').code).toBe('VALIDATION_ERROR');
    expect(new NotFoundError('x').code).toBe('NOT_FOUND');
    expect(new ForbiddenError('no').code).toBe('FORBIDDEN');
    expect(new UnauthorizedError('au').code).toBe('UNAUTHORIZED');
    expect(new ConflictError('dup').code).toBe('CONFLICT');
    expect(new ValidationError('x').name).toBe('ValidationError');
  });

  it('ValidationError accepts optional details', () => {
    const e = new ValidationError('bad', { field: 'title' });
    expect(e.details).toEqual({ field: 'title' });
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run src/domain/__tests__/errors.test.ts
```

Expected: all failing, "Cannot find module '../errors'".

- [ ] **Step 3: Implement `errors.ts`**

```typescript
// src/domain/errors.ts
export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly details?: unknown) {
    super('VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super('NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super('FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string) {
    super('UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super('CONFLICT', message);
    this.name = 'ConflictError';
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/domain/__tests__/errors.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/domain/errors.ts src/domain/__tests__/errors.test.ts
git commit -m "feat(domain): add typed error hierarchy"
```

---

## Phase 2: Domain — Ports (Interfaces)

### Task 2.1: Define repository and service ports

**Files:**
- Create: `backend/src/domain/evaluation/EvaluationRepository.ts`
- Create: `backend/src/domain/user/UserRepository.ts`
- Create: `backend/src/domain/auth/TokenService.ts`

> Ports are interfaces — no runtime tests. They are exercised indirectly by use case tests (which mock them) and adapter integration tests (which implement them).

- [ ] **Step 1: Create `EvaluationRepository.ts`**

```typescript
// src/domain/evaluation/EvaluationRepository.ts
import type { Evaluation, EvaluationStatus } from './Evaluation';

export interface ListFilters {
  status?: EvaluationStatus;
  courseId?: string;
  limit?: number;
  cursor?: string;
}

export interface PaginatedEvaluations {
  items: Evaluation[];
  nextCursor: string | null;
}

export interface EvaluationRepository {
  save(e: Evaluation): Promise<void>;
  findById(id: string): Promise<Evaluation | null>;
  listByUser(userId: string, filters: ListFilters): Promise<PaginatedEvaluations>;
  update(e: Evaluation): Promise<void>;
}
```

- [ ] **Step 2: Create `UserRepository.ts`**

```typescript
// src/domain/user/UserRepository.ts
import type { User } from './User';

export interface UserRepository {
  save(u: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}
```

- [ ] **Step 3: Create `TokenService.ts`**

```typescript
// src/domain/auth/TokenService.ts
export interface TokenPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenService {
  signPair(payload: TokenPayload): Promise<TokenPair>;
  signAccess(payload: TokenPayload): Promise<string>;
  verifyAccess(token: string): Promise<TokenPayload>;
  verifyRefresh(token: string): Promise<TokenPayload>;
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/domain/evaluation/EvaluationRepository.ts \
        src/domain/user/UserRepository.ts \
        src/domain/auth/TokenService.ts
git commit -m "feat(domain): define repository and token service ports"
```

---

## Phase 3: Use Cases (TDD)

> Every use case is a higher-order function: takes deps, returns an async function. Tests mock the port interfaces directly. Each task below: failing test → impl → passing test → commit.

### Task 3.1: `signUp` use case

**Files:**
- Create: `backend/src/domain/use-cases/signUp.ts`
- Create: `backend/src/domain/use-cases/__tests__/signUp.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/domain/use-cases/__tests__/signUp.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp } from '../signUp';
import { ConflictError, ValidationError } from '../../errors';
import type { UserRepository } from '../../user/UserRepository';
import type { TokenService } from '../../auth/TokenService';

function makeRepo(): UserRepository {
  return { save: vi.fn(), findByEmail: vi.fn() };
}
function makeTokens(): TokenService {
  return {
    signPair: vi.fn().mockResolvedValue({ accessToken: 'AT', refreshToken: 'RT' }),
    signAccess: vi.fn(),
    verifyAccess: vi.fn(),
    verifyRefresh: vi.fn(),
  };
}
const hasher = { hash: vi.fn().mockResolvedValue('hashed$xxx') };

describe('signUp', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hashes password, persists user, and returns tokens + public user', async () => {
    const userRepo = makeRepo();
    (userRepo.findByEmail as any).mockResolvedValue(null);
    const tokens = makeTokens();

    const result = await signUp({ userRepo, tokens, hasher })({
      email: 'NEW@avacom.com', password: 'password123', name: 'New',
    });

    expect(hasher.hash).toHaveBeenCalledWith('password123', 10);
    expect(userRepo.save).toHaveBeenCalledOnce();
    const saved = (userRepo.save as any).mock.calls[0][0];
    expect(saved.email).toBe('new@avacom.com');
    expect(saved.passwordHash).toBe('hashed$xxx');
    expect(result.tokens).toEqual({ accessToken: 'AT', refreshToken: 'RT' });
    expect(result.user).toEqual({ userId: saved.userId, email: 'new@avacom.com', name: 'New' });
  });

  it('rejects when email already exists', async () => {
    const userRepo = makeRepo();
    (userRepo.findByEmail as any).mockResolvedValue({ email: 'x@y.com' });

    await expect(
      signUp({ userRepo, tokens: makeTokens(), hasher })({
        email: 'x@y.com', password: 'password123', name: 'X',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('rejects password shorter than 8 chars', async () => {
    const userRepo = makeRepo();
    (userRepo.findByEmail as any).mockResolvedValue(null);

    await expect(
      signUp({ userRepo, tokens: makeTokens(), hasher })({
        email: 'a@b.com', password: 'short', name: 'A',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('normalizes email before lookup', async () => {
    const userRepo = makeRepo();
    (userRepo.findByEmail as any).mockResolvedValue(null);

    await signUp({ userRepo, tokens: makeTokens(), hasher })({
      email: '  USER@DOMAIN.COM  ', password: 'password123', name: 'X',
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('user@domain.com');
  });

  it('returns userId and email in token payload', async () => {
    const userRepo = makeRepo();
    (userRepo.findByEmail as any).mockResolvedValue(null);
    const tokens = makeTokens();

    await signUp({ userRepo, tokens, hasher })({
      email: 'a@b.com', password: 'password123', name: 'A',
    });

    const call = (tokens.signPair as any).mock.calls[0][0];
    expect(call.email).toBe('a@b.com');
    expect(call.userId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run src/domain/use-cases/__tests__/signUp.test.ts
```

Expected: 5 failures, "Cannot find module '../signUp'".

- [ ] **Step 3: Implement `signUp.ts`**

```typescript
// src/domain/use-cases/signUp.ts
import type { UserRepository } from '../user/UserRepository';
import type { TokenPair, TokenService } from '../auth/TokenService';
import type { PublicUser } from '../user/User';
import { User } from '../user/User';
import { ConflictError, ValidationError } from '../errors';

export interface Hasher {
  hash(password: string, rounds: number): Promise<string>;
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

export interface SignUpResult {
  user: PublicUser;
  tokens: TokenPair;
}

export interface SignUpDeps {
  userRepo: UserRepository;
  tokens: TokenService;
  hasher: Hasher;
}

export function signUp(deps: SignUpDeps) {
  return async (input: SignUpInput): Promise<SignUpResult> => {
    if (input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    const email = input.email.trim().toLowerCase();
    const existing = await deps.userRepo.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await deps.hasher.hash(input.password, 10);
    const user = User.create({ email, passwordHash, name: input.name });
    await deps.userRepo.save(user);

    const tokens = await deps.tokens.signPair({ userId: user.userId, email: user.email });
    return { user: User.toPublic(user), tokens };
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/domain/use-cases/__tests__/signUp.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/domain/use-cases/signUp.ts src/domain/use-cases/__tests__/signUp.test.ts
git commit -m "feat(use-case): add signUp with password hashing and email normalization"
```

---

### Task 3.2: `login` use case

**Files:**
- Create: `backend/src/domain/use-cases/login.ts`
- Create: `backend/src/domain/use-cases/__tests__/login.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/domain/use-cases/__tests__/login.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login } from '../login';
import { UnauthorizedError } from '../../errors';
import type { UserRepository } from '../../user/UserRepository';
import type { TokenService } from '../../auth/TokenService';

const validUser = {
  userId: 'u-1', email: 'a@b.com', passwordHash: 'hashed$xxx',
  name: 'A', createdAt: '2026-05-17T10:00:00.000Z',
};

function deps() {
  return {
    userRepo: { save: vi.fn(), findByEmail: vi.fn().mockResolvedValue(validUser) } as UserRepository,
    tokens: {
      signPair: vi.fn().mockResolvedValue({ accessToken: 'AT', refreshToken: 'RT' }),
      signAccess: vi.fn(), verifyAccess: vi.fn(), verifyRefresh: vi.fn(),
    } as TokenService,
    verifier: { compare: vi.fn().mockResolvedValue(true) },
  };
}

describe('login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns tokens + public user on valid credentials', async () => {
    const d = deps();
    const result = await login(d)({ email: 'a@b.com', password: 'password123' });
    expect(d.verifier.compare).toHaveBeenCalledWith('password123', 'hashed$xxx');
    expect(result.tokens).toEqual({ accessToken: 'AT', refreshToken: 'RT' });
    expect(result.user).toEqual({ userId: 'u-1', email: 'a@b.com', name: 'A' });
  });

  it('throws UnauthorizedError when user not found (no enumeration)', async () => {
    const d = deps();
    (d.userRepo.findByEmail as any).mockResolvedValue(null);
    await expect(login(d)({ email: 'x@y.com', password: 'password123' }))
      .rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when password mismatches', async () => {
    const d = deps();
    (d.verifier.compare as any).mockResolvedValue(false);
    await expect(login(d)({ email: 'a@b.com', password: 'wrong' }))
      .rejects.toThrow(UnauthorizedError);
  });

  it('uses the same error message for "not found" and "bad password"', async () => {
    const d = deps();
    (d.userRepo.findByEmail as any).mockResolvedValue(null);
    const e1 = await login(d)({ email: 'x@y.com', password: 'password123' }).catch(e => e);
    (d.userRepo.findByEmail as any).mockResolvedValue(validUser);
    (d.verifier.compare as any).mockResolvedValue(false);
    const e2 = await login(d)({ email: 'a@b.com', password: 'wrong' }).catch(e => e);
    expect(e1.message).toBe(e2.message);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run src/domain/use-cases/__tests__/login.test.ts
```

Expected: 4 failures, "Cannot find module '../login'".

- [ ] **Step 3: Implement `login.ts`**

```typescript
// src/domain/use-cases/login.ts
import type { UserRepository } from '../user/UserRepository';
import type { TokenPair, TokenService } from '../auth/TokenService';
import type { PublicUser } from '../user/User';
import { User } from '../user/User';
import { UnauthorizedError } from '../errors';

export interface PasswordVerifier {
  compare(password: string, hash: string): Promise<boolean>;
}

export interface LoginInput { email: string; password: string; }
export interface LoginResult { user: PublicUser; tokens: TokenPair; }

export interface LoginDeps {
  userRepo: UserRepository;
  tokens: TokenService;
  verifier: PasswordVerifier;
}

const GENERIC_AUTH_ERROR = 'Invalid email or password';

export function login(deps: LoginDeps) {
  return async (input: LoginInput): Promise<LoginResult> => {
    const email = input.email.trim().toLowerCase();
    const user = await deps.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError(GENERIC_AUTH_ERROR);

    const ok = await deps.verifier.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError(GENERIC_AUTH_ERROR);

    const tokens = await deps.tokens.signPair({ userId: user.userId, email: user.email });
    return { user: User.toPublic(user), tokens };
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run src/domain/use-cases/__tests__/login.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/domain/use-cases/login.ts src/domain/use-cases/__tests__/login.test.ts
git commit -m "feat(use-case): add login with generic error message"
```

---

### Task 3.3: `refreshToken`, `getCurrentUser` use cases

**Files:**
- Create: `backend/src/domain/use-cases/refreshToken.ts`
- Create: `backend/src/domain/use-cases/getCurrentUser.ts`
- Create: `backend/src/domain/use-cases/__tests__/refreshToken.test.ts`
- Create: `backend/src/domain/use-cases/__tests__/getCurrentUser.test.ts`

- [ ] **Step 1: Write `refreshToken.test.ts`**

```typescript
// src/domain/use-cases/__tests__/refreshToken.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshToken } from '../refreshToken';
import { UnauthorizedError } from '../../errors';

function deps() {
  return {
    tokens: {
      signPair: vi.fn(),
      signAccess: vi.fn().mockResolvedValue('NEW_AT'),
      verifyAccess: vi.fn(),
      verifyRefresh: vi.fn().mockResolvedValue({ userId: 'u-1', email: 'a@b.com' }),
    },
  };
}

describe('refreshToken', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a new access token when refresh is valid', async () => {
    const d = deps();
    const result = await refreshToken(d)({ refreshToken: 'RT' });
    expect(d.tokens.verifyRefresh).toHaveBeenCalledWith('RT');
    expect(d.tokens.signAccess).toHaveBeenCalledWith({ userId: 'u-1', email: 'a@b.com' });
    expect(result).toEqual({ accessToken: 'NEW_AT' });
  });

  it('throws UnauthorizedError when refresh verification fails', async () => {
    const d = deps();
    (d.tokens.verifyRefresh as any).mockRejectedValue(new Error('expired'));
    await expect(refreshToken(d)({ refreshToken: 'bad' }))
      .rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when refresh token is empty', async () => {
    const d = deps();
    await expect(refreshToken(d)({ refreshToken: '' }))
      .rejects.toThrow(UnauthorizedError);
    expect(d.tokens.verifyRefresh).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement `refreshToken.ts`**

```typescript
// src/domain/use-cases/refreshToken.ts
import type { TokenService } from '../auth/TokenService';
import { UnauthorizedError } from '../errors';

export interface RefreshDeps { tokens: TokenService; }
export interface RefreshInput { refreshToken: string; }
export interface RefreshResult { accessToken: string; }

export function refreshToken(deps: RefreshDeps) {
  return async (input: RefreshInput): Promise<RefreshResult> => {
    if (!input.refreshToken) throw new UnauthorizedError('Missing refresh token');
    let payload;
    try {
      payload = await deps.tokens.verifyRefresh(input.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
    const accessToken = await deps.tokens.signAccess({
      userId: payload.userId, email: payload.email,
    });
    return { accessToken };
  };
}
```

- [ ] **Step 3: Run and verify pass**

```bash
npx vitest run src/domain/use-cases/__tests__/refreshToken.test.ts
```

Expected: 3 passed.

- [ ] **Step 4: Write `getCurrentUser.test.ts`**

```typescript
// src/domain/use-cases/__tests__/getCurrentUser.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUser } from '../getCurrentUser';
import { NotFoundError } from '../../errors';

const u = { userId: 'u-1', email: 'a@b.com', passwordHash: 'h', name: 'A', createdAt: '2026' };

describe('getCurrentUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns public user when found', async () => {
    const userRepo = { save: vi.fn(), findByEmail: vi.fn().mockResolvedValue(u) };
    const result = await getCurrentUser({ userRepo })({ email: 'a@b.com' });
    expect(result).toEqual({ userId: 'u-1', email: 'a@b.com', name: 'A' });
  });

  it('throws NotFoundError if user does not exist', async () => {
    const userRepo = { save: vi.fn(), findByEmail: vi.fn().mockResolvedValue(null) };
    await expect(getCurrentUser({ userRepo })({ email: 'x@y.com' }))
      .rejects.toThrow(NotFoundError);
  });
});
```

- [ ] **Step 5: Implement `getCurrentUser.ts`**

```typescript
// src/domain/use-cases/getCurrentUser.ts
import type { UserRepository } from '../user/UserRepository';
import type { PublicUser } from '../user/User';
import { User } from '../user/User';
import { NotFoundError } from '../errors';

export interface GetCurrentUserDeps { userRepo: UserRepository; }
export interface GetCurrentUserInput { email: string; }

export function getCurrentUser(deps: GetCurrentUserDeps) {
  return async (input: GetCurrentUserInput): Promise<PublicUser> => {
    const u = await deps.userRepo.findByEmail(input.email);
    if (!u) throw new NotFoundError('User not found');
    return User.toPublic(u);
  };
}
```

- [ ] **Step 6: Run and verify**

```bash
npx vitest run src/domain/use-cases/__tests__/getCurrentUser.test.ts
```

Expected: 2 passed.

- [ ] **Step 7: Commit**

```bash
git add src/domain/use-cases/refreshToken.ts \
        src/domain/use-cases/getCurrentUser.ts \
        src/domain/use-cases/__tests__/refreshToken.test.ts \
        src/domain/use-cases/__tests__/getCurrentUser.test.ts
git commit -m "feat(use-case): add refreshToken and getCurrentUser"
```

---

### Task 3.4: Evaluation CRUD use cases (5 use cases, TDD each)

**Files:**
- Create: `backend/src/domain/use-cases/createEvaluation.ts`
- Create: `backend/src/domain/use-cases/getEvaluation.ts`
- Create: `backend/src/domain/use-cases/listEvaluations.ts`
- Create: `backend/src/domain/use-cases/updateEvaluation.ts`
- Create: `backend/src/domain/use-cases/deleteEvaluation.ts`
- Create: matching test file for each in `__tests__/`

> Shared test helper to avoid repetition. Build the in-memory repo factory first.

- [ ] **Step 1: Create test helper for in-memory evaluations repo**

```typescript
// src/domain/use-cases/__tests__/helpers.ts
import { vi } from 'vitest';
import type { Evaluation } from '../../evaluation/Evaluation';
import type { EvaluationRepository, ListFilters, PaginatedEvaluations } from '../../evaluation/EvaluationRepository';

export function makeEvaluationRepo(initial: Evaluation[] = []): EvaluationRepository {
  const store = new Map<string, Evaluation>(initial.map(e => [e.evaluationId, e]));
  return {
    save: vi.fn(async (e: Evaluation) => { store.set(e.evaluationId, e); }),
    findById: vi.fn(async (id: string) => store.get(id) ?? null),
    listByUser: vi.fn(async (userId: string, f: ListFilters): Promise<PaginatedEvaluations> => {
      const filtered = [...store.values()]
        .filter(e => e.userId === userId)
        .filter(e => e.deletedAt === null)
        .filter(e => !f.status || e.status === f.status)
        .filter(e => !f.courseId || e.courseId === f.courseId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const limit = f.limit ?? 25;
      const start = f.cursor ? filtered.findIndex(e => e.evaluationId === f.cursor) + 1 : 0;
      const page = filtered.slice(start, start + limit);
      const nextCursor = start + limit < filtered.length ? page.at(-1)!.evaluationId : null;
      return { items: page, nextCursor };
    }),
    update: vi.fn(async (e: Evaluation) => {
      if (!store.has(e.evaluationId)) throw new Error('not in repo');
      store.set(e.evaluationId, e);
    }),
  };
}

export function fixture(overrides: Partial<Evaluation> = {}): Evaluation {
  return {
    evaluationId: 'eval-1', userId: 'u-1', courseId: 'CS101',
    title: 't', description: 'd', dueDate: '2026-06-01T12:00:00.000Z',
    status: 'active', createdAt: '2026-05-17T10:00:00.000Z',
    updatedAt: '2026-05-17T10:00:00.000Z', deletedAt: null, ...overrides,
  };
}
```

- [ ] **Step 2: Write `createEvaluation.test.ts`**

```typescript
// src/domain/use-cases/__tests__/createEvaluation.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEvaluation } from '../createEvaluation';
import { makeEvaluationRepo } from './helpers';

describe('createEvaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T10:00:00.000Z'));
  });

  it('creates evaluation with userId from input (NOT from body)', async () => {
    const repo = makeEvaluationRepo();
    const result = await createEvaluation({ repo })({
      userId: 'u-from-token',
      courseId: 'CS101', title: 't', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });
    expect(result.userId).toBe('u-from-token');
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it('sets timestamps and null deletedAt', async () => {
    const repo = makeEvaluationRepo();
    const result = await createEvaluation({ repo })({
      userId: 'u-1', courseId: 'CS101', title: 't', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });
    expect(result.createdAt).toBe('2026-05-17T10:00:00.000Z');
    expect(result.updatedAt).toBe('2026-05-17T10:00:00.000Z');
    expect(result.deletedAt).toBeNull();
  });

  it('generates a unique evaluationId', async () => {
    const repo = makeEvaluationRepo();
    const a = await createEvaluation({ repo })({ userId: 'u', courseId: 'c', title: 't', description: 'd', dueDate: '2026', status: 'active' });
    const b = await createEvaluation({ repo })({ userId: 'u', courseId: 'c', title: 't', description: 'd', dueDate: '2026', status: 'active' });
    expect(a.evaluationId).not.toBe(b.evaluationId);
  });
});
```

- [ ] **Step 3: Implement `createEvaluation.ts`**

```typescript
// src/domain/use-cases/createEvaluation.ts
import type { EvaluationRepository } from '../evaluation/EvaluationRepository';
import { Evaluation, type EvaluationStatus } from '../evaluation/Evaluation';

export interface CreateEvaluationDeps { repo: EvaluationRepository; }
export interface CreateEvaluationInput {
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: EvaluationStatus;
}

export function createEvaluation(deps: CreateEvaluationDeps) {
  return async (input: CreateEvaluationInput) => {
    const evaluation = Evaluation.create(input);
    await deps.repo.save(evaluation);
    return evaluation;
  };
}
```

- [ ] **Step 4: Run and verify pass**

```bash
npx vitest run src/domain/use-cases/__tests__/createEvaluation.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Write `getEvaluation.test.ts`**

```typescript
// src/domain/use-cases/__tests__/getEvaluation.test.ts
import { describe, it, expect } from 'vitest';
import { getEvaluation } from '../getEvaluation';
import { ForbiddenError, NotFoundError } from '../../errors';
import { makeEvaluationRepo, fixture } from './helpers';

describe('getEvaluation', () => {
  it('returns the evaluation when owner matches', async () => {
    const e = fixture({ evaluationId: 'eval-1', userId: 'u-1' });
    const result = await getEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: 'eval-1', userId: 'u-1',
    });
    expect(result.evaluationId).toBe('eval-1');
  });

  it('throws NotFoundError when not found', async () => {
    await expect(
      getEvaluation({ repo: makeEvaluationRepo() })({ evaluationId: 'x', userId: 'u-1' })
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when caller is not the owner', async () => {
    const e = fixture({ evaluationId: 'eval-1', userId: 'other' });
    await expect(
      getEvaluation({ repo: makeEvaluationRepo([e]) })({ evaluationId: 'eval-1', userId: 'u-1' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('hides soft-deleted evaluations (treated as NotFound)', async () => {
    const e = fixture({ evaluationId: 'eval-1', userId: 'u-1', deletedAt: '2026' });
    await expect(
      getEvaluation({ repo: makeEvaluationRepo([e]) })({ evaluationId: 'eval-1', userId: 'u-1' })
    ).rejects.toThrow(NotFoundError);
  });
});
```

- [ ] **Step 6: Implement `getEvaluation.ts`**

```typescript
// src/domain/use-cases/getEvaluation.ts
import type { EvaluationRepository } from '../evaluation/EvaluationRepository';
import { Evaluation } from '../evaluation/Evaluation';
import { ForbiddenError, NotFoundError } from '../errors';

export interface GetEvaluationDeps { repo: EvaluationRepository; }
export interface GetEvaluationInput { evaluationId: string; userId: string; }

export function getEvaluation(deps: GetEvaluationDeps) {
  return async (input: GetEvaluationInput) => {
    const e = await deps.repo.findById(input.evaluationId);
    if (!e || Evaluation.isDeleted(e)) throw new NotFoundError('Evaluation not found');
    if (e.userId !== input.userId) throw new ForbiddenError('Access denied');
    return e;
  };
}
```

- [ ] **Step 7: Run and verify**

```bash
npx vitest run src/domain/use-cases/__tests__/getEvaluation.test.ts
```

Expected: 4 passed.

- [ ] **Step 8: Write `listEvaluations.test.ts`**

```typescript
// src/domain/use-cases/__tests__/listEvaluations.test.ts
import { describe, it, expect } from 'vitest';
import { listEvaluations } from '../listEvaluations';
import { makeEvaluationRepo, fixture } from './helpers';

describe('listEvaluations', () => {
  it('returns only the caller user evaluations', async () => {
    const repo = makeEvaluationRepo([
      fixture({ evaluationId: '1', userId: 'u-1' }),
      fixture({ evaluationId: '2', userId: 'other' }),
    ]);
    const r = await listEvaluations({ repo })({ userId: 'u-1' });
    expect(r.items).toHaveLength(1);
    expect(r.items[0].evaluationId).toBe('1');
  });

  it('filters by status', async () => {
    const repo = makeEvaluationRepo([
      fixture({ evaluationId: '1', userId: 'u-1', status: 'active' }),
      fixture({ evaluationId: '2', userId: 'u-1', status: 'completed' }),
    ]);
    const r = await listEvaluations({ repo })({ userId: 'u-1', status: 'completed' });
    expect(r.items.map(i => i.evaluationId)).toEqual(['2']);
  });

  it('filters by courseId', async () => {
    const repo = makeEvaluationRepo([
      fixture({ evaluationId: '1', userId: 'u-1', courseId: 'A' }),
      fixture({ evaluationId: '2', userId: 'u-1', courseId: 'B' }),
    ]);
    const r = await listEvaluations({ repo })({ userId: 'u-1', courseId: 'B' });
    expect(r.items.map(i => i.evaluationId)).toEqual(['2']);
  });

  it('excludes soft-deleted', async () => {
    const repo = makeEvaluationRepo([
      fixture({ evaluationId: '1', userId: 'u-1' }),
      fixture({ evaluationId: '2', userId: 'u-1', deletedAt: '2026' }),
    ]);
    const r = await listEvaluations({ repo })({ userId: 'u-1' });
    expect(r.items.map(i => i.evaluationId)).toEqual(['1']);
  });

  it('paginates with cursor and respects limit', async () => {
    const repo = makeEvaluationRepo([
      fixture({ evaluationId: '1', userId: 'u-1', createdAt: '2026-05-17T10:00:00.001Z' }),
      fixture({ evaluationId: '2', userId: 'u-1', createdAt: '2026-05-17T10:00:00.002Z' }),
      fixture({ evaluationId: '3', userId: 'u-1', createdAt: '2026-05-17T10:00:00.003Z' }),
    ]);
    const first = await listEvaluations({ repo })({ userId: 'u-1', limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();

    const next = await listEvaluations({ repo })({ userId: 'u-1', limit: 2, cursor: first.nextCursor! });
    expect(next.items).toHaveLength(1);
    expect(next.nextCursor).toBeNull();
  });

  it('returns empty array when user has no evaluations', async () => {
    const r = await listEvaluations({ repo: makeEvaluationRepo() })({ userId: 'u-1' });
    expect(r.items).toEqual([]);
    expect(r.nextCursor).toBeNull();
  });
});
```

- [ ] **Step 9: Implement `listEvaluations.ts`**

```typescript
// src/domain/use-cases/listEvaluations.ts
import type { EvaluationRepository, PaginatedEvaluations } from '../evaluation/EvaluationRepository';
import type { EvaluationStatus } from '../evaluation/Evaluation';

export interface ListEvaluationsDeps { repo: EvaluationRepository; }
export interface ListEvaluationsInput {
  userId: string;
  status?: EvaluationStatus;
  courseId?: string;
  limit?: number;
  cursor?: string;
}

export function listEvaluations(deps: ListEvaluationsDeps) {
  return async (input: ListEvaluationsInput): Promise<PaginatedEvaluations> => {
    return deps.repo.listByUser(input.userId, {
      status: input.status,
      courseId: input.courseId,
      limit: input.limit,
      cursor: input.cursor,
    });
  };
}
```

- [ ] **Step 10: Run and verify**

```bash
npx vitest run src/domain/use-cases/__tests__/listEvaluations.test.ts
```

Expected: 6 passed.

- [ ] **Step 11: Write `updateEvaluation.test.ts`**

```typescript
// src/domain/use-cases/__tests__/updateEvaluation.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateEvaluation } from '../updateEvaluation';
import { ForbiddenError, NotFoundError } from '../../errors';
import { makeEvaluationRepo, fixture } from './helpers';

describe('updateEvaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T11:00:00.000Z'));
  });

  it('updates fields and persists', async () => {
    const e = fixture({ evaluationId: '1', userId: 'u-1', title: 'Old' });
    const repo = makeEvaluationRepo([e]);
    const result = await updateEvaluation({ repo })({
      evaluationId: '1', userId: 'u-1', patch: { title: 'New', status: 'completed' },
    });
    expect(result.title).toBe('New');
    expect(result.status).toBe('completed');
    expect(result.updatedAt).toBe('2026-05-17T11:00:00.000Z');
    expect(repo.update).toHaveBeenCalledOnce();
  });

  it('throws NotFoundError when not found', async () => {
    await expect(updateEvaluation({ repo: makeEvaluationRepo() })({
      evaluationId: 'x', userId: 'u-1', patch: { title: 'N' },
    })).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when not the owner', async () => {
    const e = fixture({ evaluationId: '1', userId: 'other' });
    await expect(updateEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: '1', userId: 'u-1', patch: { title: 'N' },
    })).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError when soft-deleted', async () => {
    const e = fixture({ evaluationId: '1', userId: 'u-1', deletedAt: '2026' });
    await expect(updateEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: '1', userId: 'u-1', patch: { title: 'N' },
    })).rejects.toThrow(NotFoundError);
  });

  it('preserves unchanged fields', async () => {
    const e = fixture({ evaluationId: '1', userId: 'u-1', description: 'keep me' });
    const result = await updateEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: '1', userId: 'u-1', patch: { title: 'New' },
    });
    expect(result.description).toBe('keep me');
  });
});
```

- [ ] **Step 12: Implement `updateEvaluation.ts`**

```typescript
// src/domain/use-cases/updateEvaluation.ts
import type { EvaluationRepository } from '../evaluation/EvaluationRepository';
import { Evaluation, type EvaluationPatch } from '../evaluation/Evaluation';
import { ForbiddenError, NotFoundError } from '../errors';

export interface UpdateEvaluationDeps { repo: EvaluationRepository; }
export interface UpdateEvaluationInput {
  evaluationId: string;
  userId: string;
  patch: EvaluationPatch;
}

export function updateEvaluation(deps: UpdateEvaluationDeps) {
  return async (input: UpdateEvaluationInput) => {
    const existing = await deps.repo.findById(input.evaluationId);
    if (!existing || Evaluation.isDeleted(existing)) {
      throw new NotFoundError('Evaluation not found');
    }
    if (existing.userId !== input.userId) {
      throw new ForbiddenError('Access denied');
    }
    const updated = Evaluation.applyPatch(existing, input.patch);
    await deps.repo.update(updated);
    return updated;
  };
}
```

- [ ] **Step 13: Run and verify**

```bash
npx vitest run src/domain/use-cases/__tests__/updateEvaluation.test.ts
```

Expected: 5 passed.

- [ ] **Step 14: Write `deleteEvaluation.test.ts`**

```typescript
// src/domain/use-cases/__tests__/deleteEvaluation.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteEvaluation } from '../deleteEvaluation';
import { ForbiddenError, NotFoundError } from '../../errors';
import { makeEvaluationRepo, fixture } from './helpers';

describe('deleteEvaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T11:00:00.000Z'));
  });

  it('soft-deletes by setting deletedAt', async () => {
    const e = fixture({ evaluationId: '1', userId: 'u-1' });
    const repo = makeEvaluationRepo([e]);
    await deleteEvaluation({ repo })({ evaluationId: '1', userId: 'u-1' });
    const persisted = (repo.update as any).mock.calls[0][0];
    expect(persisted.deletedAt).toBe('2026-05-17T11:00:00.000Z');
  });

  it('throws NotFoundError when not found', async () => {
    await expect(deleteEvaluation({ repo: makeEvaluationRepo() })({
      evaluationId: 'x', userId: 'u-1',
    })).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when not the owner', async () => {
    const e = fixture({ evaluationId: '1', userId: 'other' });
    await expect(deleteEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: '1', userId: 'u-1',
    })).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError when already deleted', async () => {
    const e = fixture({ evaluationId: '1', userId: 'u-1', deletedAt: '2026' });
    await expect(deleteEvaluation({ repo: makeEvaluationRepo([e]) })({
      evaluationId: '1', userId: 'u-1',
    })).rejects.toThrow(NotFoundError);
  });
});
```

- [ ] **Step 15: Implement `deleteEvaluation.ts`**

```typescript
// src/domain/use-cases/deleteEvaluation.ts
import type { EvaluationRepository } from '../evaluation/EvaluationRepository';
import { Evaluation } from '../evaluation/Evaluation';
import { ForbiddenError, NotFoundError } from '../errors';

export interface DeleteEvaluationDeps { repo: EvaluationRepository; }
export interface DeleteEvaluationInput { evaluationId: string; userId: string; }

export function deleteEvaluation(deps: DeleteEvaluationDeps) {
  return async (input: DeleteEvaluationInput): Promise<void> => {
    const existing = await deps.repo.findById(input.evaluationId);
    if (!existing || Evaluation.isDeleted(existing)) {
      throw new NotFoundError('Evaluation not found');
    }
    if (existing.userId !== input.userId) {
      throw new ForbiddenError('Access denied');
    }
    await deps.repo.update(Evaluation.softDelete(existing));
  };
}
```

- [ ] **Step 16: Run and verify**

```bash
npx vitest run src/domain/use-cases/__tests__/deleteEvaluation.test.ts
```

Expected: 4 passed.

- [ ] **Step 17: Run ALL use case tests to confirm nothing regressed**

```bash
npx vitest run src/domain/use-cases/
```

Expected: ~30 tests passing across all use case files.

- [ ] **Step 18: Commit**

```bash
git add src/domain/use-cases/
git commit -m "feat(use-case): add evaluation CRUD use cases (create, get, list, update, delete)"
```

---

## Phase 4: Adapters

### Task 4.1: `JwtTokenService` adapter

**Files:**
- Create: `backend/src/adapters/auth/JwtTokenService.ts`
- Create: `backend/src/adapters/auth/__tests__/JwtTokenService.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/adapters/auth/__tests__/JwtTokenService.test.ts
import { describe, it, expect } from 'vitest';
import { JwtTokenService } from '../JwtTokenService';

const SECRET = 'a-very-long-secret-for-tests-only-32chars+';

describe('JwtTokenService', () => {
  const svc = new JwtTokenService(SECRET, { accessTtl: '15m', refreshTtl: '7d' });

  it('signs and verifies an access token roundtrip', async () => {
    const at = await svc.signAccess({ userId: 'u-1', email: 'a@b.com' });
    const payload = await svc.verifyAccess(at);
    expect(payload).toEqual({ userId: 'u-1', email: 'a@b.com' });
  });

  it('signs and verifies a refresh token roundtrip', async () => {
    const { refreshToken } = await svc.signPair({ userId: 'u-1', email: 'a@b.com' });
    const payload = await svc.verifyRefresh(refreshToken);
    expect(payload.userId).toBe('u-1');
  });

  it('verifyAccess rejects refresh token (wrong typ)', async () => {
    const { refreshToken } = await svc.signPair({ userId: 'u-1', email: 'a@b.com' });
    await expect(svc.verifyAccess(refreshToken)).rejects.toThrow();
  });

  it('rejects token signed with a different secret', async () => {
    const other = new JwtTokenService('different-very-long-secret-32chars+xx', { accessTtl: '15m', refreshTtl: '7d' });
    const at = await other.signAccess({ userId: 'u-1', email: 'a@b.com' });
    await expect(svc.verifyAccess(at)).rejects.toThrow();
  });

  it('rejects malformed token', async () => {
    await expect(svc.verifyAccess('not-a-jwt')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run src/adapters/auth/__tests__/JwtTokenService.test.ts
```

Expected: 5 failures, "Cannot find module '../JwtTokenService'".

- [ ] **Step 3: Implement `JwtTokenService.ts`**

```typescript
// src/adapters/auth/JwtTokenService.ts
import { SignJWT, jwtVerify } from 'jose';
import type { TokenService, TokenPayload, TokenPair } from '../../domain/auth/TokenService';

export interface TokenTtls {
  accessTtl: string;   // jose format: '15m', '7d', etc.
  refreshTtl: string;
}

export class JwtTokenService implements TokenService {
  private readonly secret: Uint8Array;
  constructor(secret: string, private readonly ttls: TokenTtls) {
    this.secret = new TextEncoder().encode(secret);
  }

  async signAccess(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload, typ: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setSubject(payload.userId)
      .setExpirationTime(this.ttls.accessTtl)
      .sign(this.secret);
  }

  private async signRefresh(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload, typ: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setSubject(payload.userId)
      .setExpirationTime(this.ttls.refreshTtl)
      .sign(this.secret);
  }

  async signPair(payload: TokenPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccess(payload),
      this.signRefresh(payload),
    ]);
    return { accessToken, refreshToken };
  }

  async verifyAccess(token: string): Promise<TokenPayload> {
    return this.verify(token, 'access');
  }

  async verifyRefresh(token: string): Promise<TokenPayload> {
    return this.verify(token, 'refresh');
  }

  private async verify(token: string, expectedTyp: 'access' | 'refresh'): Promise<TokenPayload> {
    const { payload } = await jwtVerify(token, this.secret, { algorithms: ['HS256'] });
    if (payload.typ !== expectedTyp) throw new Error(`Token type mismatch: expected ${expectedTyp}`);
    return { userId: payload.userId as string, email: payload.email as string };
  }
}
```

- [ ] **Step 4: Run and verify**

```bash
npx vitest run src/adapters/auth/__tests__/JwtTokenService.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/adapters/auth/
git commit -m "feat(adapter): add JwtTokenService using jose"
```

---

### Task 4.2: DynamoDB client + repositories (integration tests)

**Files:**
- Create: `backend/src/adapters/persistence/dynamoClient.ts`
- Create: `backend/src/adapters/persistence/DynamoEvaluationRepository.ts`
- Create: `backend/src/adapters/persistence/DynamoUserRepository.ts`
- Create: `backend/src/adapters/persistence/__tests__/DynamoEvaluationRepository.integration.test.ts`
- Create: `backend/src/adapters/persistence/__tests__/DynamoUserRepository.integration.test.ts`

- [ ] **Step 1: Create `dynamoClient.ts`**

```typescript
// src/adapters/persistence/dynamoClient.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export function makeDocClient(endpoint?: string): DynamoDBDocumentClient {
  const client = new DynamoDBClient(
    endpoint
      ? { endpoint, region: 'us-east-1', credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' } }
      : {},
  );
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
}
```

- [ ] **Step 2: Start DynamoDB Local**

```bash
npm run ddb:up
sleep 3
```

- [ ] **Step 3: Write `DynamoEvaluationRepository.integration.test.ts`**

```typescript
// src/adapters/persistence/__tests__/DynamoEvaluationRepository.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoEvaluationRepository } from '../DynamoEvaluationRepository';
import { Evaluation } from '../../../domain/evaluation/Evaluation';
import { ddbClient, TEST_EVALUATIONS_TABLE } from '../../../__tests__/setup-integration';

const doc = DynamoDBDocumentClient.from(ddbClient);

async function clearTable() {
  const all = await doc.send(new ScanCommand({ TableName: TEST_EVALUATIONS_TABLE }));
  for (const item of all.Items ?? []) {
    await doc.send(new (await import('@aws-sdk/lib-dynamodb')).DeleteCommand({
      TableName: TEST_EVALUATIONS_TABLE, Key: { evaluationId: item.evaluationId },
    }));
  }
}

describe('DynamoEvaluationRepository (integration)', () => {
  const repo = new DynamoEvaluationRepository(TEST_EVALUATIONS_TABLE, doc);
  beforeEach(clearTable);

  it('save() and findById() roundtrip', async () => {
    const e = Evaluation.create({
      userId: 'u-1', courseId: 'CS101', title: 't', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });
    await repo.save(e);
    expect(await repo.findById(e.evaluationId)).toEqual(e);
  });

  it('findById() returns null when not found', async () => {
    expect(await repo.findById('missing')).toBeNull();
  });

  it('listByUser() returns user evaluations sorted by createdAt desc', async () => {
    const eOld = Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'old', description: 'd', dueDate: '2026', status: 'active' });
    await new Promise(r => setTimeout(r, 5));
    const eNew = Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'new', description: 'd', dueDate: '2026', status: 'active' });
    const eOther = Evaluation.create({ userId: 'other', courseId: 'c', title: 'x', description: 'd', dueDate: '2026', status: 'active' });
    await Promise.all([repo.save(eOld), repo.save(eNew), repo.save(eOther)]);

    const result = await repo.listByUser('u-1', {});
    expect(result.items.map(i => i.title)).toEqual(['new', 'old']);
    expect(result.nextCursor).toBeNull();
  });

  it('listByUser() filters by status', async () => {
    await repo.save(Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'a', description: 'd', dueDate: '2026', status: 'active' }));
    await repo.save(Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'b', description: 'd', dueDate: '2026', status: 'completed' }));
    const r = await repo.listByUser('u-1', { status: 'completed' });
    expect(r.items.map(i => i.title)).toEqual(['b']);
  });

  it('listByUser() filters by courseId', async () => {
    await repo.save(Evaluation.create({ userId: 'u-1', courseId: 'A', title: 'a', description: 'd', dueDate: '2026', status: 'active' }));
    await repo.save(Evaluation.create({ userId: 'u-1', courseId: 'B', title: 'b', description: 'd', dueDate: '2026', status: 'active' }));
    const r = await repo.listByUser('u-1', { courseId: 'B' });
    expect(r.items.map(i => i.title)).toEqual(['b']);
  });

  it('listByUser() excludes soft-deleted', async () => {
    const a = Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'a', description: 'd', dueDate: '2026', status: 'active' });
    const b = Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'b', description: 'd', dueDate: '2026', status: 'active' });
    await repo.save(a);
    await repo.save(Evaluation.softDelete(b));
    const r = await repo.listByUser('u-1', {});
    expect(r.items.map(i => i.title)).toEqual(['a']);
  });

  it('listByUser() paginates with cursor', async () => {
    for (let i = 0; i < 3; i++) {
      await repo.save(Evaluation.create({ userId: 'u-1', courseId: 'c', title: `t${i}`, description: 'd', dueDate: '2026', status: 'active' }));
      await new Promise(r => setTimeout(r, 5));
    }
    const first = await repo.listByUser('u-1', { limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();
    const second = await repo.listByUser('u-1', { limit: 2, cursor: first.nextCursor! });
    expect(second.items).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });

  it('update() persists changes', async () => {
    const e = Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'old', description: 'd', dueDate: '2026', status: 'active' });
    await repo.save(e);
    const updated = Evaluation.applyPatch(e, { title: 'new' });
    await repo.update(updated);
    expect((await repo.findById(e.evaluationId))?.title).toBe('new');
  });
});
```

- [ ] **Step 4: Implement `DynamoEvaluationRepository.ts`**

```typescript
// src/adapters/persistence/DynamoEvaluationRepository.ts
import {
  DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  EvaluationRepository, ListFilters, PaginatedEvaluations,
} from '../../domain/evaluation/EvaluationRepository';
import type { Evaluation } from '../../domain/evaluation/Evaluation';
import { makeDocClient } from './dynamoClient';

const GSI_NAME = 'userId-createdAt-index';

export class DynamoEvaluationRepository implements EvaluationRepository {
  constructor(
    private readonly tableName: string,
    private readonly doc: DynamoDBDocumentClient = makeDocClient(),
  ) {}

  async save(e: Evaluation): Promise<void> {
    await this.doc.send(new PutCommand({ TableName: this.tableName, Item: e }));
  }

  async update(e: Evaluation): Promise<void> {
    await this.doc.send(new PutCommand({ TableName: this.tableName, Item: e }));
  }

  async findById(id: string): Promise<Evaluation | null> {
    const r = await this.doc.send(new GetCommand({
      TableName: this.tableName, Key: { evaluationId: id },
    }));
    return (r.Item as Evaluation | undefined) ?? null;
  }

  async listByUser(userId: string, f: ListFilters): Promise<PaginatedEvaluations> {
    const limit = f.limit ?? 25;
    const filterParts: string[] = ['(attribute_not_exists(deletedAt) OR deletedAt = :null)'];
    const values: Record<string, unknown> = { ':uid': userId, ':null': null };
    const names: Record<string, string> = {};

    if (f.status) {
      filterParts.push('#st = :st');
      names['#st'] = 'status';
      values[':st'] = f.status;
    }
    if (f.courseId) {
      filterParts.push('courseId = :cid');
      values[':cid'] = f.courseId;
    }

    const exclusiveStartKey = f.cursor
      ? JSON.parse(Buffer.from(f.cursor, 'base64').toString('utf-8'))
      : undefined;

    const r = await this.doc.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: GSI_NAME,
      KeyConditionExpression: 'userId = :uid',
      FilterExpression: filterParts.join(' AND '),
      ExpressionAttributeValues: values,
      ...(Object.keys(names).length > 0 ? { ExpressionAttributeNames: names } : {}),
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
    }));

    const nextCursor = r.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(r.LastEvaluatedKey)).toString('base64')
      : null;

    return { items: (r.Items as Evaluation[]) ?? [], nextCursor };
  }
}
```

- [ ] **Step 5: Run integration tests**

```bash
npx vitest run --project integration src/adapters/persistence/__tests__/DynamoEvaluationRepository.integration.test.ts
```

Expected: 8 passed.

- [ ] **Step 6: Write `DynamoUserRepository.integration.test.ts`**

```typescript
// src/adapters/persistence/__tests__/DynamoUserRepository.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoUserRepository } from '../DynamoUserRepository';
import { User } from '../../../domain/user/User';
import { ddbClient, TEST_USERS_TABLE } from '../../../__tests__/setup-integration';

const doc = DynamoDBDocumentClient.from(ddbClient);

async function clearTable() {
  const all = await doc.send(new ScanCommand({ TableName: TEST_USERS_TABLE }));
  for (const item of all.Items ?? []) {
    await doc.send(new DeleteCommand({ TableName: TEST_USERS_TABLE, Key: { email: item.email } }));
  }
}

describe('DynamoUserRepository (integration)', () => {
  const repo = new DynamoUserRepository(TEST_USERS_TABLE, doc);
  beforeEach(clearTable);

  it('save() and findByEmail() roundtrip', async () => {
    const u = User.create({ email: 'a@b.com', passwordHash: 'h', name: 'A' });
    await repo.save(u);
    expect(await repo.findByEmail('a@b.com')).toEqual(u);
  });

  it('findByEmail() returns null when not found', async () => {
    expect(await repo.findByEmail('missing@example.com')).toBeNull();
  });

  it('findByEmail() normalizes lookup to lowercase', async () => {
    const u = User.create({ email: 'lower@case.com', passwordHash: 'h', name: 'A' });
    await repo.save(u);
    expect(await repo.findByEmail('LOWER@CASE.com')).toEqual(u);
  });

  it('save() rejects when email already exists', async () => {
    const u1 = User.create({ email: 'dup@x.com', passwordHash: 'h', name: 'A' });
    await repo.save(u1);
    const u2 = User.create({ email: 'dup@x.com', passwordHash: 'h2', name: 'B' });
    await expect(repo.save(u2)).rejects.toThrow();
  });
});
```

- [ ] **Step 7: Implement `DynamoUserRepository.ts`**

```typescript
// src/adapters/persistence/DynamoUserRepository.ts
import {
  DynamoDBDocumentClient, GetCommand, PutCommand,
} from '@aws-sdk/lib-dynamodb';
import type { UserRepository } from '../../domain/user/UserRepository';
import type { User } from '../../domain/user/User';
import { makeDocClient } from './dynamoClient';

export class DynamoUserRepository implements UserRepository {
  constructor(
    private readonly tableName: string,
    private readonly doc: DynamoDBDocumentClient = makeDocClient(),
  ) {}

  async save(u: User): Promise<void> {
    await this.doc.send(new PutCommand({
      TableName: this.tableName,
      Item: u,
      ConditionExpression: 'attribute_not_exists(email)',
    }));
  }

  async findByEmail(email: string): Promise<User | null> {
    const r = await this.doc.send(new GetCommand({
      TableName: this.tableName,
      Key: { email: email.trim().toLowerCase() },
    }));
    return (r.Item as User | undefined) ?? null;
  }
}
```

- [ ] **Step 8: Run user repo tests**

```bash
npx vitest run --project integration src/adapters/persistence/__tests__/DynamoUserRepository.integration.test.ts
```

Expected: 4 passed.

- [ ] **Step 9: Commit**

```bash
git add src/adapters/persistence/
git commit -m "feat(adapter): add DynamoDB repos for Evaluation and User with integration tests"
```

---

## Phase 5: HTTP Layer

### Task 5.1: Zod schemas + tests

**Files:**
- Create: `backend/src/http/schemas.ts`
- Create: `backend/src/http/__tests__/schemas.test.ts`

- [ ] **Step 1: Write `schemas.test.ts`**

```typescript
// src/http/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  signupSchema, loginSchema, createEvaluationSchema,
  updateEvaluationSchema, listEvaluationsQuerySchema,
} from '../schemas';

describe('schemas', () => {
  describe('signupSchema', () => {
    it('accepts valid input', () => {
      expect(signupSchema.safeParse({ email: 'a@b.com', password: 'password123', name: 'A' }).success).toBe(true);
    });
    it('rejects short password', () => {
      expect(signupSchema.safeParse({ email: 'a@b.com', password: 'short', name: 'A' }).success).toBe(false);
    });
    it('rejects invalid email', () => {
      expect(signupSchema.safeParse({ email: 'not-email', password: 'password123', name: 'A' }).success).toBe(false);
    });
    it('rejects missing name', () => {
      expect(signupSchema.safeParse({ email: 'a@b.com', password: 'password123' }).success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid', () => {
      expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    });
    it('rejects missing password', () => {
      expect(loginSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
    });
  });

  describe('createEvaluationSchema', () => {
    const ok = { courseId: 'CS101', title: 'Midterm', description: 'desc', dueDate: '2026-06-01T12:00:00.000Z', status: 'active' };
    it('accepts valid', () => { expect(createEvaluationSchema.safeParse(ok).success).toBe(true); });
    it('rejects bad status', () => { expect(createEvaluationSchema.safeParse({ ...ok, status: 'x' }).success).toBe(false); });
    it('rejects bad dueDate', () => { expect(createEvaluationSchema.safeParse({ ...ok, dueDate: 'tomorrow' }).success).toBe(false); });
    it('rejects empty title', () => { expect(createEvaluationSchema.safeParse({ ...ok, title: '' }).success).toBe(false); });
  });

  describe('updateEvaluationSchema', () => {
    it('accepts partial', () => {
      expect(updateEvaluationSchema.safeParse({ title: 'new' }).success).toBe(true);
    });
    it('rejects empty patch', () => {
      expect(updateEvaluationSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('listEvaluationsQuerySchema', () => {
    it('accepts empty', () => {
      expect(listEvaluationsQuerySchema.safeParse({}).success).toBe(true);
    });
    it('coerces limit to number', () => {
      const r = listEvaluationsQuerySchema.safeParse({ limit: '10' });
      expect(r.success && r.data.limit).toBe(10);
    });
    it('rejects bad status', () => {
      expect(listEvaluationsQuerySchema.safeParse({ status: 'wat' }).success).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Implement `schemas.ts`**

```typescript
// src/http/schemas.ts
import { z } from 'zod';

export const evaluationStatusSchema = z.enum(['active', 'completed', 'cancelled']);

export const signupSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).trim(),
});
export type SignupBody = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof loginSchema>;

export const createEvaluationSchema = z.object({
  courseId: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  dueDate: z.string().datetime(),
  status: evaluationStatusSchema,
});
export type CreateEvaluationBody = z.infer<typeof createEvaluationSchema>;

export const updateEvaluationSchema = z.object({
  courseId: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  status: evaluationStatusSchema.optional(),
}).refine(o => Object.keys(o).length > 0, { message: 'At least one field is required' });
export type UpdateEvaluationBody = z.infer<typeof updateEvaluationSchema>;

export const listEvaluationsQuerySchema = z.object({
  status: evaluationStatusSchema.optional(),
  courseId: z.string().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});
export type ListEvaluationsQuery = z.infer<typeof listEvaluationsQuerySchema>;
```

- [ ] **Step 3: Run and verify**

```bash
npx vitest run src/http/__tests__/schemas.test.ts
```

Expected: ~15 passed.

- [ ] **Step 4: Commit**

```bash
git add src/http/schemas.ts src/http/__tests__/schemas.test.ts
git commit -m "feat(http): add Zod schemas with validation"
```

---

### Task 5.2: Cookies helper

**Files:**
- Create: `backend/src/http/cookies.ts`
- Create: `backend/src/http/__tests__/cookies.test.ts`

- [ ] **Step 1: Write `cookies.test.ts`**

```typescript
// src/http/__tests__/cookies.test.ts
import { describe, it, expect } from 'vitest';
import { buildSetAccessCookie, buildSetRefreshCookie, buildClearCookies, parseCookies } from '../cookies';

describe('cookies', () => {
  it('buildSetAccessCookie sets HttpOnly Secure SameSite=Strict path=/ max-age', () => {
    const c = buildSetAccessCookie('TOKEN');
    expect(c).toContain('access_token=TOKEN');
    expect(c).toContain('HttpOnly');
    expect(c).toContain('Secure');
    expect(c).toContain('SameSite=Strict');
    expect(c).toContain('Path=/');
    expect(c).toContain('Max-Age=900');
  });

  it('buildSetRefreshCookie scopes path to /api/auth and 7-day TTL', () => {
    const c = buildSetRefreshCookie('TOKEN');
    expect(c).toContain('refresh_token=TOKEN');
    expect(c).toContain('Path=/api/auth');
    expect(c).toContain('Max-Age=604800');
  });

  it('buildClearCookies returns both clear directives', () => {
    const out = buildClearCookies();
    expect(out).toHaveLength(2);
    expect(out[0]).toContain('access_token=; Max-Age=0');
    expect(out[1]).toContain('refresh_token=; Max-Age=0');
  });

  it('parseCookies extracts access and refresh tokens', () => {
    const r = parseCookies('access_token=AAA; refresh_token=BBB');
    expect(r).toEqual({ access_token: 'AAA', refresh_token: 'BBB' });
  });

  it('parseCookies returns empty object on missing header', () => {
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies('')).toEqual({});
  });

  it('parseCookies handles extra spaces and quoting', () => {
    expect(parseCookies('a=1;  b=2;c="quoted"')).toEqual({ a: '1', b: '2', c: 'quoted' });
  });
});
```

- [ ] **Step 2: Implement `cookies.ts`**

```typescript
// src/http/cookies.ts
const ACCESS_TTL_SECONDS = 60 * 15;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;

const COMMON_FLAGS = 'HttpOnly; Secure; SameSite=Strict';

export function buildSetAccessCookie(token: string): string {
  return `access_token=${token}; Path=/; ${COMMON_FLAGS}; Max-Age=${ACCESS_TTL_SECONDS}`;
}

export function buildSetRefreshCookie(token: string): string {
  return `refresh_token=${token}; Path=/api/auth; ${COMMON_FLAGS}; Max-Age=${REFRESH_TTL_SECONDS}`;
}

export function buildClearCookies(): string[] {
  return [
    `access_token=; Path=/; ${COMMON_FLAGS}; Max-Age=0`,
    `refresh_token=; Path=/api/auth; ${COMMON_FLAGS}; Max-Age=0`,
  ];
}

export function parseCookies(header: string | undefined | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const pair of header.split(';')) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}
```

- [ ] **Step 3: Run and verify**

```bash
npx vitest run src/http/__tests__/cookies.test.ts
```

Expected: 6 passed.

- [ ] **Step 4: Commit**

```bash
git add src/http/cookies.ts src/http/__tests__/cookies.test.ts
git commit -m "feat(http): add cookie helpers"
```

---

### Task 5.3: Auth middleware + error handler + logger

**Files:**
- Create: `backend/src/http/middleware/authMiddleware.ts`
- Create: `backend/src/http/middleware/errorHandler.ts`
- Create: `backend/src/http/middleware/loggerMiddleware.ts`
- Create: `backend/src/http/middleware/__tests__/authMiddleware.test.ts`
- Create: `backend/src/http/middleware/__tests__/errorHandler.test.ts`

- [ ] **Step 1: Write `authMiddleware.test.ts`**

```typescript
// src/http/middleware/__tests__/authMiddleware.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from '../authMiddleware';
import type { TokenService } from '../../../domain/auth/TokenService';

function makeTokens(payload: { userId: string; email: string } | null = { userId: 'u-1', email: 'a@b.com' }, throwErr = false): TokenService {
  return {
    signPair: vi.fn(), signAccess: vi.fn(),
    verifyAccess: vi.fn().mockImplementation(async () => {
      if (throwErr) throw new Error('bad');
      if (!payload) throw new Error('no payload');
      return payload;
    }),
    verifyRefresh: vi.fn(),
  };
}

function makeApp(tokens: TokenService) {
  const app = new Hono();
  app.use('*', authMiddleware(tokens));
  app.get('/test', (c) => c.json({ userId: c.get('userId'), email: c.get('userEmail') }));
  return app;
}

describe('authMiddleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets userId and userEmail when token valid', async () => {
    const app = makeApp(makeTokens());
    const r = await app.request('/test', { headers: { Cookie: 'access_token=AT' } });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ userId: 'u-1', email: 'a@b.com' });
  });

  it('returns 401 when no cookie', async () => {
    const r = await makeApp(makeTokens()).request('/test');
    expect(r.status).toBe(401);
  });

  it('returns 401 when access_token cookie absent', async () => {
    const r = await makeApp(makeTokens()).request('/test', { headers: { Cookie: 'other=x' } });
    expect(r.status).toBe(401);
  });

  it('returns 401 when token verification fails', async () => {
    const r = await makeApp(makeTokens(null, true)).request('/test', { headers: { Cookie: 'access_token=BAD' } });
    expect(r.status).toBe(401);
  });

  it('passes through Cookie parsing with quoted values', async () => {
    const r = await makeApp(makeTokens()).request('/test', { headers: { Cookie: 'access_token="AT"' } });
    expect(r.status).toBe(200);
  });
});
```

- [ ] **Step 2: Implement `authMiddleware.ts`**

```typescript
// src/http/middleware/authMiddleware.ts
import type { Context, MiddlewareHandler } from 'hono';
import type { TokenService } from '../../domain/auth/TokenService';
import { parseCookies } from '../cookies';
import { UnauthorizedError } from '../../domain/errors';

export interface AuthVariables {
  userId: string;
  userEmail: string;
}

export function authMiddleware(tokens: TokenService): MiddlewareHandler {
  return async (c: Context, next) => {
    const cookies = parseCookies(c.req.header('Cookie'));
    const token = cookies['access_token'];
    if (!token) throw new UnauthorizedError('Authentication required');
    let payload;
    try { payload = await tokens.verifyAccess(token); }
    catch { throw new UnauthorizedError('Invalid or expired access token'); }
    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    await next();
  };
}
```

- [ ] **Step 3: Run authMiddleware tests**

```bash
npx vitest run src/http/middleware/__tests__/authMiddleware.test.ts
```

Expected: 5 passed.

- [ ] **Step 4: Write `errorHandler.test.ts`**

```typescript
// src/http/middleware/__tests__/errorHandler.test.ts
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { errorHandler } from '../errorHandler';
import {
  ValidationError, NotFoundError, ForbiddenError,
  UnauthorizedError, ConflictError, DomainError,
} from '../../../domain/errors';

function makeApp(throwErr: Error) {
  const app = new Hono();
  app.onError(errorHandler);
  app.get('/x', () => { throw throwErr; });
  return app;
}

describe('errorHandler', () => {
  it.each([
    [new ValidationError('bad'), 400, 'VALIDATION_ERROR'],
    [new UnauthorizedError('au'), 401, 'UNAUTHORIZED'],
    [new ForbiddenError('no'), 403, 'FORBIDDEN'],
    [new NotFoundError('x'), 404, 'NOT_FOUND'],
    [new ConflictError('dup'), 409, 'CONFLICT'],
  ])('maps %s to status %d code %s', async (err, status, code) => {
    const r = await makeApp(err).request('/x');
    expect(r.status).toBe(status);
    expect(await r.json()).toMatchObject({ error: { code, message: err.message } });
  });

  it('maps unknown DomainError to 500 INTERNAL_ERROR', async () => {
    const r = await makeApp(new DomainError('SOMETHING', 'oops')).request('/x');
    expect(r.status).toBe(500);
  });

  it('maps generic Error to 500 INTERNAL_ERROR (hides message)', async () => {
    const r = await makeApp(new Error('private')).request('/x');
    expect(r.status).toBe(500);
    expect(await r.json()).toMatchObject({ error: { code: 'INTERNAL_ERROR' } });
    expect(await (await makeApp(new Error('private')).request('/x')).text()).not.toContain('private');
  });

  it('includes ValidationError details in response', async () => {
    const r = await makeApp(new ValidationError('bad', { field: 'title' })).request('/x');
    expect((await r.json() as any).error.details).toEqual({ field: 'title' });
  });
});
```

- [ ] **Step 5: Implement `errorHandler.ts`**

```typescript
// src/http/middleware/errorHandler.ts
import type { Context, ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import {
  DomainError, ValidationError, UnauthorizedError,
  ForbiddenError, NotFoundError, ConflictError,
} from '../../domain/errors';

const STATUS_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  if (err instanceof ZodError) {
    return c.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: err.flatten() },
    }, 400);
  }
  if (err instanceof ValidationError) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: err.message, details: err.details } }, 400);
  }
  if (err instanceof DomainError) {
    const status = STATUS_MAP[err.code] ?? 500;
    return c.json({ error: { code: err.code, message: err.message } }, status as any);
  }
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, 500);
};
```

- [ ] **Step 6: Run errorHandler tests**

```bash
npx vitest run src/http/middleware/__tests__/errorHandler.test.ts
```

Expected: 8 passed.

- [ ] **Step 7: Implement `loggerMiddleware.ts`** (no test file — exercised via integration tests)

```typescript
// src/http/middleware/loggerMiddleware.ts
import type { MiddlewareHandler } from 'hono';
import { Logger } from '@aws-lambda-powertools/logger';
import { randomUUID } from 'node:crypto';

const logger = new Logger({ serviceName: 'avacom-api' });

export function loggerMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const correlationId = c.req.header('x-correlation-id') ?? randomUUID();
    const started = Date.now();
    logger.appendKeys({ correlationId });
    logger.info('request_received', { method: c.req.method, path: c.req.path });

    try {
      await next();
    } finally {
      logger.info('request_completed', {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - started,
      });
      logger.removeKeys(['correlationId']);
    }
  };
}
```

- [ ] **Step 8: Commit**

```bash
git add src/http/middleware/
git commit -m "feat(http): add auth, error, and logger middleware"
```

---

### Task 5.4: Routes (auth, evaluations, health)

**Files:**
- Create: `backend/src/http/routes/auth.routes.ts`
- Create: `backend/src/http/routes/evaluations.routes.ts`
- Create: `backend/src/http/routes/health.routes.ts`
- Create: `backend/src/http/app.ts`

> Routes are exercised by HTTP integration tests in Phase 6. No standalone route tests.

- [ ] **Step 1: Create `auth.routes.ts`**

```typescript
// src/http/routes/auth.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { UserRepository } from '../../domain/user/UserRepository';
import type { TokenService } from '../../domain/auth/TokenService';
import { signUp, type Hasher } from '../../domain/use-cases/signUp';
import { login, type PasswordVerifier } from '../../domain/use-cases/login';
import { refreshToken } from '../../domain/use-cases/refreshToken';
import { getCurrentUser } from '../../domain/use-cases/getCurrentUser';
import { signupSchema, loginSchema } from '../schemas';
import { buildSetAccessCookie, buildSetRefreshCookie, buildClearCookies, parseCookies } from '../cookies';

export interface AuthDeps {
  userRepo: UserRepository;
  tokens: TokenService;
  hasher: Hasher;
  verifier: PasswordVerifier;
}

export function buildAuthRoutes(deps: AuthDeps) {
  const r = new Hono();

  r.post('/signup', zValidator('json', signupSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await signUp(deps)(body);
    c.header('Set-Cookie', buildSetAccessCookie(result.tokens.accessToken), { append: true });
    c.header('Set-Cookie', buildSetRefreshCookie(result.tokens.refreshToken), { append: true });
    return c.json({ user: result.user }, 201);
  });

  r.post('/login', zValidator('json', loginSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await login(deps)(body);
    c.header('Set-Cookie', buildSetAccessCookie(result.tokens.accessToken), { append: true });
    c.header('Set-Cookie', buildSetRefreshCookie(result.tokens.refreshToken), { append: true });
    return c.json({ user: result.user });
  });

  r.post('/refresh', async (c) => {
    const cookies = parseCookies(c.req.header('Cookie'));
    const { accessToken } = await refreshToken(deps)({ refreshToken: cookies['refresh_token'] ?? '' });
    c.header('Set-Cookie', buildSetAccessCookie(accessToken));
    return c.body(null, 204);
  });

  r.post('/logout', async (c) => {
    for (const cookie of buildClearCookies()) c.header('Set-Cookie', cookie, { append: true });
    return c.body(null, 204);
  });

  return r;
}

export function buildMeRoute(deps: { userRepo: UserRepository }) {
  const r = new Hono<{ Variables: { userId: string; userEmail: string } }>();
  r.get('/', async (c) => {
    const user = await getCurrentUser(deps)({ email: c.get('userEmail') });
    return c.json({ user });
  });
  return r;
}
```

- [ ] **Step 2: Create `evaluations.routes.ts`**

```typescript
// src/http/routes/evaluations.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { EvaluationRepository } from '../../domain/evaluation/EvaluationRepository';
import { createEvaluation } from '../../domain/use-cases/createEvaluation';
import { getEvaluation } from '../../domain/use-cases/getEvaluation';
import { listEvaluations } from '../../domain/use-cases/listEvaluations';
import { updateEvaluation } from '../../domain/use-cases/updateEvaluation';
import { deleteEvaluation } from '../../domain/use-cases/deleteEvaluation';
import {
  createEvaluationSchema, updateEvaluationSchema, listEvaluationsQuerySchema,
} from '../schemas';

export interface EvaluationsDeps { repo: EvaluationRepository; }
type Vars = { Variables: { userId: string; userEmail: string } };

export function buildEvaluationsRoutes(deps: EvaluationsDeps) {
  const r = new Hono<Vars>();

  r.get('/', zValidator('query', listEvaluationsQuerySchema), async (c) => {
    const userId = c.get('userId');
    const q = c.req.valid('query');
    const result = await listEvaluations(deps)({ userId, ...q });
    return c.json(result);
  });

  r.get('/:id', async (c) => {
    const userId = c.get('userId');
    const evaluation = await getEvaluation(deps)({
      evaluationId: c.req.param('id'), userId,
    });
    return c.json({ evaluation });
  });

  r.post('/', zValidator('json', createEvaluationSchema), async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const evaluation = await createEvaluation(deps)({ userId, ...body });
    return c.json({ evaluation }, 201);
  });

  r.put('/:id', zValidator('json', updateEvaluationSchema), async (c) => {
    const userId = c.get('userId');
    const patch = c.req.valid('json');
    const evaluation = await updateEvaluation(deps)({
      evaluationId: c.req.param('id'), userId, patch,
    });
    return c.json({ evaluation });
  });

  r.delete('/:id', async (c) => {
    const userId = c.get('userId');
    await deleteEvaluation(deps)({ evaluationId: c.req.param('id'), userId });
    return c.body(null, 204);
  });

  return r;
}
```

- [ ] **Step 3: Create `health.routes.ts`**

```typescript
// src/http/routes/health.routes.ts
import { Hono } from 'hono';

const STARTED_AT = Date.now();

export function buildHealthRoutes() {
  const r = new Hono();
  r.get('/', (c) => c.json({
    status: 'ok',
    version: process.env.APP_VERSION ?? 'dev',
    uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
  }));
  return r;
}
```

- [ ] **Step 4: Create `app.ts`**

```typescript
// src/http/app.ts
import { Hono } from 'hono';
import type { UserRepository } from '../domain/user/UserRepository';
import type { EvaluationRepository } from '../domain/evaluation/EvaluationRepository';
import type { TokenService } from '../domain/auth/TokenService';
import type { Hasher } from '../domain/use-cases/signUp';
import type { PasswordVerifier } from '../domain/use-cases/login';
import { authMiddleware } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { buildAuthRoutes, buildMeRoute } from './routes/auth.routes';
import { buildEvaluationsRoutes } from './routes/evaluations.routes';
import { buildHealthRoutes } from './routes/health.routes';

export interface AppDeps {
  userRepo: UserRepository;
  evaluationRepo: EvaluationRepository;
  tokens: TokenService;
  hasher: Hasher;
  verifier: PasswordVerifier;
}

export function buildApp(deps: AppDeps) {
  const app = new Hono();
  app.onError(errorHandler);
  app.use('*', loggerMiddleware());

  app.route('/api/health', buildHealthRoutes());
  app.route('/api/auth', buildAuthRoutes(deps));

  app.use('/api/auth/me', authMiddleware(deps.tokens));
  app.route('/api/auth/me', buildMeRoute(deps));

  app.use('/api/evaluations/*', authMiddleware(deps.tokens));
  app.route('/api/evaluations', buildEvaluationsRoutes({ repo: deps.evaluationRepo }));

  return app;
}
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/http/routes/ src/http/app.ts
git commit -m "feat(http): add auth, evaluations, health routes and app builder"
```

---

### Task 5.5: Composition + handler

**Files:**
- Create: `backend/src/composition.ts`
- Create: `backend/src/handler.ts`

- [ ] **Step 1: Install bcryptjs adapter wrapper** (no test — covered by integration tests)

```typescript
// src/adapters/auth/bcryptHasher.ts
import bcrypt from 'bcryptjs';
import type { Hasher } from '../../domain/use-cases/signUp';
import type { PasswordVerifier } from '../../domain/use-cases/login';

export class BcryptHasher implements Hasher, PasswordVerifier {
  async hash(password: string, rounds: number): Promise<string> {
    return bcrypt.hash(password, rounds);
  }
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

- [ ] **Step 2: Create `composition.ts`**

```typescript
// src/composition.ts
import { DynamoEvaluationRepository } from './adapters/persistence/DynamoEvaluationRepository';
import { DynamoUserRepository } from './adapters/persistence/DynamoUserRepository';
import { JwtTokenService } from './adapters/auth/JwtTokenService';
import { BcryptHasher } from './adapters/auth/bcryptHasher';
import { buildApp } from './http/app';
import { makeDocClient } from './adapters/persistence/dynamoClient';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Required env var ${name} is missing`);
  return v;
}

export function composeApp() {
  const doc = makeDocClient(process.env.DDB_ENDPOINT);
  const evaluationRepo = new DynamoEvaluationRepository(required('EVALUATIONS_TABLE'), doc);
  const userRepo = new DynamoUserRepository(required('USERS_TABLE'), doc);
  const tokens = new JwtTokenService(required('JWT_SECRET'), { accessTtl: '15m', refreshTtl: '7d' });
  const hasher = new BcryptHasher();
  return buildApp({ evaluationRepo, userRepo, tokens, hasher, verifier: hasher });
}
```

- [ ] **Step 3: Create `handler.ts`**

```typescript
// src/handler.ts
import { handle } from 'hono/aws-lambda';
import { composeApp } from './composition';

const app = composeApp();
export const handler = handle(app);
```

- [ ] **Step 4: Typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/adapters/auth/bcryptHasher.ts src/composition.ts src/handler.ts
git commit -m "feat(backend): add composition root and Lambda handler"
```

---

## Phase 6: HTTP Integration Tests

### Task 6.1: Full app integration test (signup → login → CRUD → logout)

**Files:**
- Create: `backend/src/http/__tests__/app.integration.test.ts`

- [ ] **Step 1: Make sure DynamoDB Local is running**

```bash
npm run ddb:up
sleep 2
```

- [ ] **Step 2: Write the integration test**

```typescript
// src/http/__tests__/app.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { buildApp } from '../app';
import { DynamoEvaluationRepository } from '../../adapters/persistence/DynamoEvaluationRepository';
import { DynamoUserRepository } from '../../adapters/persistence/DynamoUserRepository';
import { JwtTokenService } from '../../adapters/auth/JwtTokenService';
import { BcryptHasher } from '../../adapters/auth/bcryptHasher';
import { ddbClient, TEST_EVALUATIONS_TABLE, TEST_USERS_TABLE } from '../../__tests__/setup-integration';

const doc = DynamoDBDocumentClient.from(ddbClient);
async function clearAll() {
  for (const t of [TEST_EVALUATIONS_TABLE, TEST_USERS_TABLE]) {
    const s = await doc.send(new ScanCommand({ TableName: t }));
    for (const i of s.Items ?? []) {
      const key = t === TEST_USERS_TABLE ? { email: i.email } : { evaluationId: i.evaluationId };
      await doc.send(new DeleteCommand({ TableName: t, Key: key }));
    }
  }
}

function buildTestApp() {
  const evaluationRepo = new DynamoEvaluationRepository(TEST_EVALUATIONS_TABLE, doc);
  const userRepo = new DynamoUserRepository(TEST_USERS_TABLE, doc);
  const tokens = new JwtTokenService('test-secret-must-be-at-least-32-chars+', { accessTtl: '15m', refreshTtl: '7d' });
  const hasher = new BcryptHasher();
  return buildApp({ evaluationRepo, userRepo, tokens, hasher, verifier: hasher });
}

function cookieHeader(setCookies: string[]): string {
  return setCookies.map(c => c.split(';')[0]).join('; ');
}

describe('app (integration)', () => {
  beforeEach(clearAll);

  it('end-to-end: signup → create → list → get → update → delete → list (empty)', async () => {
    const app = buildTestApp();

    // 1. Signup
    const signup = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'me@avacom.com', password: 'password123', name: 'Me' }),
    });
    expect(signup.status).toBe(201);
    const cookies = signup.headers.getSetCookie();
    expect(cookies).toHaveLength(2);
    const Cookie = cookieHeader(cookies);

    // 2. Create evaluation
    const create = await app.request('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie },
      body: JSON.stringify({
        courseId: 'CS101', title: 'Midterm', description: 'd',
        dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
      }),
    });
    expect(create.status).toBe(201);
    const { evaluation } = await create.json();
    expect(evaluation.userId).toBeTruthy();
    const evalId = evaluation.evaluationId;

    // 3. List
    const list = await app.request('/api/evaluations', { headers: { Cookie } });
    expect(list.status).toBe(200);
    const listBody = await list.json();
    expect(listBody.items).toHaveLength(1);

    // 4. Get
    const get = await app.request(`/api/evaluations/${evalId}`, { headers: { Cookie } });
    expect(get.status).toBe(200);

    // 5. Update
    const upd = await app.request(`/api/evaluations/${evalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie },
      body: JSON.stringify({ title: 'New title' }),
    });
    expect(upd.status).toBe(200);
    expect((await upd.json()).evaluation.title).toBe('New title');

    // 6. Delete (soft)
    const del = await app.request(`/api/evaluations/${evalId}`, {
      method: 'DELETE', headers: { Cookie },
    });
    expect(del.status).toBe(204);

    // 7. List empty
    const list2 = await app.request('/api/evaluations', { headers: { Cookie } });
    expect((await list2.json()).items).toHaveLength(0);
  });

  it('rejects request without auth cookie', async () => {
    const r = await buildTestApp().request('/api/evaluations');
    expect(r.status).toBe(401);
  });

  it('isolates evaluations per user', async () => {
    const app = buildTestApp();
    // User A creates an evaluation
    const sA = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@x.com', password: 'password123', name: 'A' }),
    });
    const cA = cookieHeader(sA.headers.getSetCookie());
    await app.request('/api/evaluations', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cA },
      body: JSON.stringify({ courseId: 'c', title: 'a-eval', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active' }),
    });

    // User B signs up and lists
    const sB = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'b@x.com', password: 'password123', name: 'B' }),
    });
    const cB = cookieHeader(sB.headers.getSetCookie());
    const list = await app.request('/api/evaluations', { headers: { Cookie: cB } });
    expect((await list.json()).items).toHaveLength(0);
  });

  it('signup with duplicate email returns 409', async () => {
    const app = buildTestApp();
    const body = JSON.stringify({ email: 'dup@x.com', password: 'password123', name: 'A' });
    await app.request('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const second = await app.request('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    expect(second.status).toBe(409);
  });

  it('login with wrong password returns 401', async () => {
    const app = buildTestApp();
    await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@x.com', password: 'password123', name: 'A' }),
    });
    const r = await app.request('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@x.com', password: 'wrongggg' }),
    });
    expect(r.status).toBe(401);
  });

  it('GET /api/health responds 200', async () => {
    const r = await buildTestApp().request('/api/health');
    expect(r.status).toBe(200);
    expect((await r.json()).status).toBe('ok');
  });

  it('logout clears cookies', async () => {
    const app = buildTestApp();
    const r = await app.request('/api/auth/logout', { method: 'POST' });
    expect(r.status).toBe(204);
    const setCookies = r.headers.getSetCookie();
    expect(setCookies.some(c => c.includes('access_token=;'))).toBe(true);
  });

  it('refresh issues a new access token from refresh cookie', async () => {
    const app = buildTestApp();
    const signup = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'r@x.com', password: 'password123', name: 'R' }),
    });
    const refreshCookie = signup.headers.getSetCookie().find(c => c.startsWith('refresh_token='))!;
    const r = await app.request('/api/auth/refresh', {
      method: 'POST', headers: { Cookie: refreshCookie.split(';')[0] },
    });
    expect(r.status).toBe(204);
    expect(r.headers.getSetCookie().some(c => c.startsWith('access_token='))).toBe(true);
  });

  it('PUT on another user evaluation returns 403', async () => {
    const app = buildTestApp();
    const sA = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@x.com', password: 'password123', name: 'A' }),
    });
    const cA = cookieHeader(sA.headers.getSetCookie());
    const create = await app.request('/api/evaluations', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cA },
      body: JSON.stringify({ courseId: 'c', title: 't', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active' }),
    });
    const evalId = (await create.json()).evaluation.evaluationId;

    const sB = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'b@x.com', password: 'password123', name: 'B' }),
    });
    const cB = cookieHeader(sB.headers.getSetCookie());

    const r = await app.request(`/api/evaluations/${evalId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cB },
      body: JSON.stringify({ title: 'hijacked' }),
    });
    expect(r.status).toBe(403);
  });

  it('validation error returns 400 with details', async () => {
    const app = buildTestApp();
    const r = await app.request('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-email', password: 'short', name: '' }),
    });
    expect(r.status).toBe(400);
    expect((await r.json()).error.code).toBe('VALIDATION_ERROR');
  });
});
```

- [ ] **Step 3: Run integration tests**

```bash
npx vitest run --project integration src/http/__tests__/app.integration.test.ts
```

Expected: 9 passed (one large + 8 standalone).

- [ ] **Step 4: Run ALL tests with coverage**

```bash
npm run test:coverage
```

Expected: all tests pass; coverage shows ≥90% on statements/branches/functions/lines. If below, identify the file in the coverage report and add the missing test in the appropriate `__tests__/`.

- [ ] **Step 5: Commit**

```bash
git add src/http/__tests__/
git commit -m "test(http): add full app integration tests with DDB Local"
```

---

## Phase 7: SAM Template and Deploy

### Task 7.1: esbuild config + SAM template

**Files:**
- Create: `backend/esbuild.config.mjs`
- Create: `backend/template.yaml`
- Create: `backend/env.local.json`
- Create: `backend/samconfig.toml`

- [ ] **Step 1: Create `esbuild.config.mjs`**

```javascript
// esbuild.config.mjs
import { build } from 'esbuild';
import { rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });

await build({
  entryPoints: ['src/handler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/handler.js',
  sourcemap: false,
  minify: true,
  external: ['@aws-sdk/*'],
  logLevel: 'info',
});

console.log('Build complete: dist/handler.js');
```

- [ ] **Step 2: Create `template.yaml`**

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: AVACOM Evaluations API (single Lambda + DynamoDB)

Parameters:
  Stage:
    Type: String
    Default: prod
    AllowedValues: [dev, staging, prod]

Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 10
    MemorySize: 512
    Architectures: [arm64]
    Environment:
      Variables:
        NODE_OPTIONS: '--enable-source-maps'
        EVALUATIONS_TABLE: !Ref EvaluationsTable
        USERS_TABLE: !Ref UsersTable
        JWT_SECRET: !Sub '{{resolve:secretsmanager:${JwtSecret}:SecretString:secret}}'
        APP_VERSION: '1.0.0'
        POWERTOOLS_SERVICE_NAME: avacom-api
        POWERTOOLS_LOG_LEVEL: INFO

Resources:
  JwtSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub avacom-jwt-secret-${Stage}
      GenerateSecretString:
        SecretStringTemplate: '{}'
        GenerateStringKey: secret
        PasswordLength: 64
        ExcludePunctuation: true

  EvaluationsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub avacom-evaluations-${Stage}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - { AttributeName: evaluationId, AttributeType: S }
        - { AttributeName: userId, AttributeType: S }
        - { AttributeName: createdAt, AttributeType: S }
      KeySchema:
        - { AttributeName: evaluationId, KeyType: HASH }
      GlobalSecondaryIndexes:
        - IndexName: userId-createdAt-index
          KeySchema:
            - { AttributeName: userId, KeyType: HASH }
            - { AttributeName: createdAt, KeyType: RANGE }
          Projection: { ProjectionType: ALL }

  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub avacom-users-${Stage}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - { AttributeName: email, AttributeType: S }
      KeySchema:
        - { AttributeName: email, KeyType: HASH }

  HttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: !Ref Stage
      CorsConfiguration:
        AllowOrigins: ['*']
        AllowHeaders: [Content-Type, Authorization]
        AllowMethods: [GET, POST, PUT, DELETE, OPTIONS]
      DefaultRouteSettings:
        ThrottlingBurstLimit: 100
        ThrottlingRateLimit: 50

  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub avacom-api-${Stage}
      CodeUri: dist/
      Handler: handler.handler
      Tracing: Active
      Policies:
        - DynamoDBCrudPolicy: { TableName: !Ref EvaluationsTable }
        - DynamoDBReadPolicy: { TableName: !Ref EvaluationsTable }
        - DynamoDBCrudPolicy: { TableName: !Ref UsersTable }
        - Statement:
            - Effect: Allow
              Action: secretsmanager:GetSecretValue
              Resource: !Ref JwtSecret
      Events:
        AnyRoute:
          Type: HttpApi
          Properties:
            ApiId: !Ref HttpApi
            Path: /{proxy+}
            Method: ANY

Outputs:
  ApiUrl:
    Description: API Gateway endpoint
    Value: !Sub https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com
    Export: { Name: !Sub avacom-api-url-${Stage} }
  EvaluationsTableName:
    Value: !Ref EvaluationsTable
  UsersTableName:
    Value: !Ref UsersTable
```

- [ ] **Step 3: Create `env.local.json` for SAM Local**

```json
{
  "ApiFunction": {
    "EVALUATIONS_TABLE": "avacom-evaluations-local",
    "USERS_TABLE": "avacom-users-local",
    "JWT_SECRET": "local-secret-must-be-at-least-32-chars-xx",
    "DDB_ENDPOINT": "http://host.docker.internal:8000",
    "APP_VERSION": "local"
  }
}
```

- [ ] **Step 4: Create `samconfig.toml`**

```toml
version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "avacom"
resolve_s3 = true
s3_prefix = "avacom"
region = "us-east-1"
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
fail_on_empty_changeset = false
```

- [ ] **Step 5: Build and validate template**

```bash
npm run build
sam validate --lint
```

Expected: "is a valid SAM Template" + no lint warnings.

- [ ] **Step 6: Commit**

```bash
git add esbuild.config.mjs template.yaml env.local.json samconfig.toml
git commit -m "feat(infra): add SAM template, esbuild config, and local env"
```

---

### Task 7.2: First deploy

**Files:**
- Modify: `backend/samconfig.toml` (SAM writes deployment metadata)

- [ ] **Step 1: Build production bundle**

```bash
cd backend
npm run build
ls -la dist/
```

Expected: `dist/handler.js` exists, size ~1-2 MB.

- [ ] **Step 2: Verify AWS credentials**

```bash
aws sts get-caller-identity
```

Expected: outputs JSON with `Account`, `UserId`, `Arn`. If not, run `aws configure`.

- [ ] **Step 3: First deploy (interactive)**

```bash
sam deploy --guided
```

Accept defaults. When prompted:
- Stack name: `avacom`
- Region: `us-east-1`
- Confirm changes before deploy: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Save arguments to samconfig.toml: `Y`

Expected: deploys successfully, outputs `ApiUrl` like `https://abc123.execute-api.us-east-1.amazonaws.com`.

- [ ] **Step 4: Capture API URL**

```bash
sam list stack-outputs --stack-name avacom --output json
```

Save the `ApiUrl` value; export it for the smoke test:

```bash
export API_URL=$(sam list stack-outputs --stack-name avacom --output json | jq -r '.[] | select(.OutputKey=="ApiUrl") | .OutputValue')
echo $API_URL
```

- [ ] **Step 5: Smoke test deployed API**

```bash
# Health
curl -s $API_URL/api/health | jq

# Signup
curl -s -c /tmp/cookies.txt -X POST $API_URL/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@avacom.com","password":"password123","name":"Smoke"}' | jq

# Create
curl -s -b /tmp/cookies.txt -X POST $API_URL/api/evaluations \
  -H 'Content-Type: application/json' \
  -d '{"courseId":"CS101","title":"Smoke Test","description":"d","dueDate":"2026-06-01T12:00:00.000Z","status":"active"}' | jq

# List
curl -s -b /tmp/cookies.txt $API_URL/api/evaluations | jq
```

Expected: all return 2xx with valid JSON.

- [ ] **Step 6: Check CloudWatch logs**

```bash
sam logs -n ApiFunction --stack-name avacom --tail
# (press Ctrl-C after seeing log entries)
```

Expected: structured JSON log lines with `correlationId`, `method`, `path`, `durationMs`.

- [ ] **Step 7: Commit the updated `samconfig.toml`**

```bash
git add samconfig.toml
git commit -m "chore(infra): record SAM deployment parameters"
```

---

### Task 7.3: README with deploy + run instructions

**Files:**
- Modify: `backend/README.md`

- [ ] **Step 1: Replace `backend/README.md`**

```markdown
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

\`\`\`bash
npm install
\`\`\`

## Local development

\`\`\`bash
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
\`\`\`

## Deploy

\`\`\`bash
npm run deploy:guided   # first time, interactive
npm run deploy          # subsequent deploys
\`\`\`

After deploy, the API URL is printed and stored in CloudFormation outputs:

\`\`\`bash
sam list stack-outputs --stack-name avacom --output json | jq
\`\`\`

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

\`\`\`
src/
├── domain/         pure business logic — no AWS, no HTTP
├── adapters/       implementations of ports — DynamoDB, JWT, bcrypt
├── http/           Hono routes, middleware, Zod schemas
├── composition.ts  dependency injection root
└── handler.ts      Lambda entry
\`\`\`

ESLint blocks `domain/*` from importing `adapters/*`, `http/*`, or AWS SDK directly.
\`\`\`
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(backend): add README with setup, deploy, and architecture links"
```

---

## Self-Review Checklist (run before declaring done)

- [ ] All 9 use cases have tests and implementations
- [ ] Domain layer has zero AWS/HTTP imports (verified by `npm run lint`)
- [ ] `npm run test:coverage` passes with ≥90% on all metrics
- [ ] SAM deploy succeeds and returns an `ApiUrl`
- [ ] Smoke test (signup → create → list) returns 200/201 from deployed API
- [ ] CloudWatch shows structured JSON logs with `correlationId`
- [ ] Every commit message follows conventional commits (`feat:`, `chore:`, `test:`, `docs:`)
- [ ] No `TODO`, `TBD`, or `FIXME` markers in committed code

## Coverage gap remediation

If `npm run test:coverage` reports <90% on any metric, identify uncovered branches in the HTML report (`coverage/index.html`) and add focused tests. Common gaps:
- Error branches in middleware (test with invalid input)
- Optional fields in schemas (test both presence and absence)
- Edge cases in pagination (empty results, exact-page boundary)

Commit each batch of remediation tests separately:

```bash
git add src/path/to/__tests__/
git commit -m "test: cover <module> error branches"
```

---

## Done. Next: Frontend plan

Once this backend is deployed and the smoke test passes, switch to the frontend plan: [`2026-05-17-avacom-frontend.md`](./2026-05-17-avacom-frontend.md).
