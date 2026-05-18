# System Architecture

High-level view of all AWS services, their connections, and request flow.

```mermaid
graph TB
    User([User Browser])

    subgraph CloudFront["AWS CloudFront — d1xxx.cloudfront.net"]
        CFDist[CloudFront Distribution<br/>HTTPS + Security Headers]
        CFBehavior1{Path-based<br/>routing}
    end

    subgraph S3Stack["S3"]
        S3[S3 Bucket — private<br/>React build artifacts]
        OAC[Origin Access Control]
    end

    subgraph APIStack["API Layer"]
        APIGW[API Gateway HTTP API<br/>Throttling: 50 req/s]
        Lambda[AWS Lambda<br/>Node.js 20 + Hono<br/>512 MB / 10s timeout]
    end

    subgraph DataStack["Data Layer"]
        DDB1[(DynamoDB<br/>EvaluationsTable<br/>+ GSI userId-createdAt)]
        DDB2[(DynamoDB<br/>UsersTable<br/>PK: email)]
    end

    subgraph SecretsStack["Secrets & Observability"]
        SM[Secrets Manager<br/>JWT_SECRET]
        CW[CloudWatch<br/>Logs + Metrics + X-Ray]
    end

    User -->|HTTPS| CFDist
    CFDist --> CFBehavior1
    CFBehavior1 -->|/*| OAC
    OAC --> S3
    CFBehavior1 -->|/api/*| APIGW
    APIGW --> Lambda
    Lambda --> DDB1
    Lambda --> DDB2
    Lambda -.reads.-> SM
    Lambda -.logs/traces/metrics.-> CW

    classDef aws fill:#FF9900,stroke:#232F3E,color:#fff
    classDef data fill:#3B48CC,stroke:#232F3E,color:#fff
    classDef obs fill:#759C3E,stroke:#232F3E,color:#fff
    class CFDist,CFBehavior1,S3,OAC,APIGW,Lambda aws
    class DDB1,DDB2 data
    class SM,CW obs
```

## Key design points

- **Single origin (CloudFront)** — frontend and `/api/*` share one domain → `SameSite=Strict` cookies work, zero CORS configuration
- **Private S3 + OAC** — bucket has Block Public Access ON; only CloudFront can read via signed Origin Access Control
- **One Lambda** — single function handles all routes via Hono router; hexagonal composition wired once at cold start
- **Multi-table DynamoDB** — Users and Evaluations are independent aggregates; multi-table chosen for readability over single-table design
- **Secrets Manager** — JWT signing key stored as auto-generated secret; rotated independently of code deploys
- **CloudWatch** — structured JSON logs (Lambda Powertools), X-Ray distributed tracing, custom metrics per endpoint
