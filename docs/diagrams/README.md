# Architecture Diagrams

Six diagrams describing the AVACOM system from different angles. All written in Mermaid (renders natively on GitHub).

| # | Diagram | Purpose | Read this when... |
|---|---|---|---|
| [01](./01-system-architecture.md) | System architecture | All AWS services + data flow | Onboarding to the system |
| [02](./02-hexagonal-architecture.md) | Hexagonal (ports & adapters) | Backend code organization | Reviewing or extending domain code |
| [03](./03-auth-flow-sequence.md) | Auth flow sequences | Signup / login / refresh / logout | Debugging auth or explaining security |
| [04](./04-crud-request-lifecycle.md) | CRUD request lifecycle | End-to-end request path through every layer | Demoing separation of concerns |
| [05](./05-data-model.md) | Data model (ERD + access patterns) | DynamoDB tables, GSI, queries | Planning a schema change |
| [06](./06-frontend-component-tree.md) | Frontend component tree | React structure, providers, routes | Adding a new page or hook |

## Demo walkthrough order (10 min)

For the live session, walk the reviewer through these in this order:

1. **§01 System architecture** (90s) — show what's deployed and how it connects
2. **§02 Hexagonal** (2m) — explain the import direction rule and why domain has no AWS imports
3. **§04 CRUD lifecycle** (3m) — trace one request from form submit to DynamoDB and back
4. **§03 Auth flow** (2m) — defend the stateless refresh + httpOnly cookie design
5. **§05 Data model** (1m) — show the GSI and how the access patterns map
6. **§06 Frontend tree** (30s) — point at the hook + page separation
