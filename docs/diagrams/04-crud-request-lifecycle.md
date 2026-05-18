# CRUD Request Lifecycle

How a single request flows through every architectural layer. This diagram is what you walk the reviewer through during the demo to show separation of concerns.

## Example: `POST /api/evaluations`

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React Form
    participant Hook as useCreateEvaluation
    participant Axios as Axios + Interceptor
    participant CF as CloudFront
    participant API as API Gateway
    participant H as handler.ts<br/>(Hono entry)
    participant LM as loggerMiddleware
    participant AM as authMiddleware
    participant EM as errorHandler
    participant R as evaluations.routes.ts
    participant V as Zod validator
    participant UC as createEvaluation<br/>(use case)
    participant Repo as EvaluationRepo<br/>(port)
    participant Dyn as DynamoEvaluationRepo<br/>(adapter)
    participant DDB as DynamoDB

    U->>FE: Fills form, clicks Save
    FE->>FE: react-hook-form + Zod validation
    FE->>Hook: mutation.mutate(formData)
    Hook->>Axios: api.post('/evaluations', body)
    Axios->>CF: HTTPS POST /api/evaluations<br/>Cookies: access_token + refresh_token
    CF->>API: forward (/api/* behavior, no cache)
    API->>H: Lambda invocation event
    H->>LM: Generate correlationId, log request
    LM->>AM: continue
    AM->>AM: Parse access_token cookie
    AM->>AM: jose.jwtVerify(token, secret)
    AM->>AM: c.set('userId', payload.sub)
    AM->>R: continue to route
    R->>V: zValidator('json', createEvaluationSchema)
    alt Body invalid
        V-->>EM: ZodError
        EM-->>FE: 400 {error: VALIDATION_ERROR, details}
        FE-->>U: Inline form errors
    else Valid
        V->>R: validated body
        R->>UC: createEvaluation(deps)<br/>({userId, ...body})
        UC->>UC: build Evaluation entity<br/>(uuid, timestamps, deletedAt: null)
        UC->>Repo: repo.save(evaluation)
        Repo->>Dyn: DynamoEvaluationRepository.save
        Dyn->>DDB: PutCommand<br/>ConditionExpression: attribute_not_exists(evaluationId)
        DDB-->>Dyn: 200 OK
        Dyn-->>UC: void
        UC-->>R: evaluation
        R-->>H: c.json(evaluation, 201)
        H->>LM: log response, status, latency
        H-->>API: 201 + body
        API-->>CF: forward
        CF-->>Axios: 201 {evaluation}
        Axios-->>Hook: response
        Hook->>Hook: queryClient.invalidateQueries(['evaluations'])
        Hook-->>FE: success
        FE->>FE: Toast "Created!"<br/>Navigate to /evaluations
    end

    note over LM,EM: Logs flushed to CloudWatch:<br/>{correlationId, userId, route, status, durationMs}
```

## What each layer does (and what it doesn't)

| Layer | Responsibility | Does NOT |
|---|---|---|
| **React Form** | Capture user input, client-side validation | Know about HTTP details |
| **Hook (TanStack Query)** | Mutation, cache invalidation, optimistic updates | Know about auth/refresh |
| **Axios + interceptor** | HTTP transport, automatic token refresh on 401 | Know about business logic |
| **CloudFront** | TLS termination, routing by path, security headers | Touch business logic |
| **API Gateway** | Throttling, request transformation, Lambda invocation | Touch business logic |
| **handler.ts** | Lambda entry, Hono dispatch | Know about specific use cases |
| **loggerMiddleware** | Correlation ID, structured request/response logs | Touch business logic |
| **authMiddleware** | Verify JWT, extract userId | Decide who can do what |
| **Route handler** | Validate input (Zod), call use case, map response | Contain business rules |
| **Use case** | Orchestrate business logic, enforce invariants | Know about HTTP, DynamoDB |
| **Port (interface)** | Define what the domain needs from persistence | Contain implementation |
| **Adapter (DynamoRepo)** | Translate domain operations to DynamoDB calls | Contain business logic |
| **DynamoDB** | Store and query data | Validate business rules |

## Why this matters for the demo

When the reviewer says *"walk me through what happens when a user creates an evaluation"*, you can point at this diagram and trace the entire path in 90 seconds. Every layer has one job, and the boundary between domain and infrastructure is enforced by the folder structure and the import rules.

When the reviewer says *"what if validation rules change?"*, you point at one file: `schemas.ts`. When they say *"what if we switched databases?"*, you point at `DynamoEvaluationRepository` and explain that the domain wouldn't change.
