# Hexagonal Architecture (Ports & Adapters)

The backend follows Alistair Cockburn's hexagonal architecture: the **domain** is pure business logic with no awareness of AWS, HTTP, or databases. It communicates with the outside world through **ports** (interfaces), and concrete **adapters** implement those ports.

```mermaid
graph TB
    subgraph DrivingSide["DRIVING SIDE (input)"]
        HTTP[HTTP Adapter<br/>Hono routes<br/>Zod validation<br/>Auth middleware]
    end

    subgraph Core["DOMAIN CORE — pure, no I/O"]
        UseCases[Use Cases<br/>signUp · login · refreshToken<br/>createEvaluation · listEvaluations<br/>updateEvaluation · deleteEvaluation<br/>getEvaluation · getCurrentUser]
        Entities[Entities<br/>Evaluation · User]
        Ports[Ports interfaces<br/>EvaluationRepository<br/>UserRepository<br/>TokenService]
    end

    subgraph DrivenSide["DRIVEN SIDE output"]
        DynamoEval[DynamoEvaluation<br/>Repository]
        DynamoUser[DynamoUser<br/>Repository]
        JwtSvc[JwtTokenService<br/>uses 'jose' lib]
    end

    DynamoDB[(DynamoDB)]
    SecretsManager[(Secrets Manager)]

    HTTP -->|invokes| UseCases
    UseCases -->|uses| Entities
    UseCases -->|depends on| Ports

    Ports -.implemented by.-> DynamoEval
    Ports -.implemented by.-> DynamoUser
    Ports -.implemented by.-> JwtSvc

    DynamoEval --> DynamoDB
    DynamoUser --> DynamoDB
    JwtSvc -.reads secret.-> SecretsManager

    classDef domain fill:#90EE90,stroke:#2D5016,color:#000,stroke-width:2px
    classDef port fill:#FFE4B5,stroke:#8B4513,color:#000,stroke-width:2px
    classDef adapter fill:#ADD8E6,stroke:#00008B,color:#000
    classDef external fill:#D3D3D3,stroke:#000,color:#000

    class UseCases,Entities domain
    class Ports port
    class HTTP,DynamoEval,DynamoUser,JwtSvc adapter
    class DynamoDB,SecretsManager external
```

## Why hexagonal here

| Benefit | How it pays off |
|---|---|
| **Domain has zero AWS imports** | Use cases are pure TypeScript — testable without mocking AWS SDK |
| **Live demo: swap an adapter** | If reviewer asks "what if we switch to PostgreSQL?", I delete `DynamoEvaluationRepository`, write `PostgresEvaluationRepository`, change one line in `composition.ts`. Domain untouched. |
| **Live demo: add a field** | Touches `Evaluation.ts` entity + `schemas.ts` Zod schema. Repository persists whatever the entity has (uses DocumentClient with object mapping). |
| **Tests run fast** | Domain unit tests have no I/O, no Docker, no mocks — pure function calls. |
| **Composition root pattern** | `composition.ts` is the ONLY file that knows how the pieces fit. Swapping implementations or wiring test doubles happens in one place. |

## Dependency direction (the critical rule)

**All arrows point INWARD toward the domain.** The domain never imports from `adapters/` or `http/`. The HTTP layer imports use cases. Adapters implement port interfaces defined in the domain. This is enforced by:

- ESLint rule: `no-restricted-imports` blocks `domain/*` files from importing `adapters/*` or `http/*` or `@aws-sdk/*`
- Folder convention: anything in `domain/` is pure; anything that touches I/O lives in `adapters/`

## File-level example

```typescript
// domain/evaluation/EvaluationRepository.ts (PORT — interface only)
export interface EvaluationRepository {
  save(e: Evaluation): Promise<void>;
  findById(id: string): Promise<Evaluation | null>;
  listByUser(userId: string, filters: ListFilters): Promise<PaginatedResult>;
  update(id: string, patch: Partial<Evaluation>, expectedUserId: string): Promise<Evaluation>;
  softDelete(id: string, expectedUserId: string): Promise<void>;
}

// adapters/persistence/DynamoEvaluationRepository.ts (ADAPTER)
export class DynamoEvaluationRepository implements EvaluationRepository {
  constructor(private tableName: string, private client = ddbDocClient) {}
  async save(e: Evaluation) { /* PutCommand */ }
  async findById(id: string) { /* GetCommand */ }
  // ...
}

// domain/use-cases/createEvaluation.ts (USE CASE — no AWS, no HTTP)
export function createEvaluation(deps: { repo: EvaluationRepository }) {
  return async (input: CreateInput) => {
    const evaluation = Evaluation.create(input);
    await deps.repo.save(evaluation);
    return evaluation;
  };
}

// composition.ts (COMPOSITION ROOT — wiring)
const repo = new DynamoEvaluationRepository(process.env.EVALUATIONS_TABLE!);
const createUseCase = createEvaluation({ repo });
// then injected into Hono routes
```
