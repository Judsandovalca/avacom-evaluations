# Auth Flow Sequence Diagrams

Four critical auth flows: **signup**, **login**, **authenticated request with auto-refresh**, and **logout**.

---

## 1. Signup

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React App
    participant CF as CloudFront
    participant API as API Gateway
    participant L as Lambda (Hono)
    participant DDB as UsersTable

    U->>FE: Fills signup form<br/>(email, password, name)
    FE->>FE: Client validation (Zod)
    FE->>CF: POST /api/auth/signup<br/>(JSON body)
    CF->>API: forward
    API->>L: invoke
    L->>L: Validate body (Zod)
    L->>L: Hash password (bcrypt, 10 rounds)
    L->>DDB: PutItem(email, userId, passwordHash, name)<br/>ConditionExpression: attribute_not_exists(email)
    alt Email already exists
        DDB-->>L: ConditionalCheckFailedException
        L-->>FE: 409 CONFLICT
        FE-->>U: "Email already registered"
    else Success
        DDB-->>L: OK
        L->>L: Sign access_token (JWT, TTL 15m)<br/>Sign refresh_token (JWT, TTL 7d)
        L-->>FE: 201 + Set-Cookie x2<br/>{user: {userId, email, name}}
        FE->>FE: Store user in AuthContext
        FE-->>U: Redirect to /evaluations
    end
```

---

## 2. Login

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React App
    participant L as Lambda
    participant DDB as UsersTable

    U->>FE: Fills login form
    FE->>L: POST /api/auth/login {email, password}
    L->>DDB: GetItem(email)
    alt User not found
        DDB-->>L: null
        L-->>FE: 401 UNAUTHORIZED<br/>"Invalid credentials"
    else User found
        DDB-->>L: {userId, passwordHash, ...}
        L->>L: bcrypt.compare(password, passwordHash)
        alt Bad password
            L-->>FE: 401 UNAUTHORIZED<br/>"Invalid credentials"
        else Match
            L->>L: Sign tokens (access 15m + refresh 7d)
            L-->>FE: 200 + Set-Cookie x2 + {user}
            FE-->>U: Redirect to /evaluations
        end
    end

    note over L: Same error message for "user not found" and<br/>"bad password" prevents email enumeration
```

---

## 3. Authenticated request with auto-refresh

This is the most important flow — defends decision §2.6 (stateless refresh).

```mermaid
sequenceDiagram
    participant FE as React App<br/>(Axios)
    participant L as Lambda
    participant Mid as authMiddleware
    participant UC as Use Case
    participant DDB as DynamoDB

    note over FE: Cookies auto-attached:<br/>access_token + refresh_token

    FE->>L: GET /api/evaluations
    L->>Mid: route hits middleware
    Mid->>Mid: Read access_token cookie
    Mid->>Mid: Verify JWT signature<br/>(jose, HS256, secret from env)

    alt Token valid
        Mid->>Mid: Extract userId, set c.var.userId
        Mid->>UC: invoke listEvaluations({userId, filters})
        UC->>DDB: Query GSI (userId-createdAt-index)<br/>+ FilterExpression for status
        DDB-->>UC: items
        UC-->>L: PaginatedResult
        L-->>FE: 200 {items, nextCursor}

    else Access token expired (401)
        Mid-->>FE: 401 UNAUTHORIZED
        note over FE: Axios interceptor catches 401
        FE->>FE: Check: original request<br/>not already retried?
        FE->>L: POST /api/auth/refresh<br/>(refresh_token cookie)
        L->>L: Verify refresh JWT signature
        alt Refresh valid
            L->>L: Sign new access_token
            L-->>FE: 200 + Set-Cookie access_token
            FE->>L: RETRY original GET /api/evaluations
            L-->>FE: 200 {items}
        else Refresh expired/invalid
            L-->>FE: 401
            FE->>FE: Clear AuthContext
            FE-->>FE: Redirect to /login
        end
    end
```

### Why this flow is safe (Q&A defense)

- **httpOnly cookies** → JavaScript cannot read them; XSS payloads cannot exfiltrate tokens
- **SameSite=Strict** → browser refuses to send cookies on cross-site requests; CSRF impossible
- **Secure** → only sent over HTTPS (enforced by CloudFront)
- **Same-origin topology** → no `Access-Control-Allow-Credentials` needed, no preflight churn
- **Stateless refresh** → no DB lookup on every refresh; signature verification only
- **Short access TTL (15m)** → window of exposure if a token somehow leaks is bounded
- **Idempotent refresh** → axios interceptor uses a single-flight promise so concurrent 401s share one refresh call

---

## 4. Logout

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React App
    participant L as Lambda

    U->>FE: Clicks "Logout"
    FE->>L: POST /api/auth/logout
    L-->>FE: 204 + Set-Cookie<br/>access_token=; Max-Age=0<br/>refresh_token=; Max-Age=0
    FE->>FE: Clear AuthContext<br/>queryClient.clear()
    FE-->>U: Redirect to /login

    note over L: Logout is decorative on the server side.<br/>Tokens remain technically valid until TTL expires,<br/>but the client has no way to present them again.<br/>If forced server-side invalidation were needed,<br/>we would add a RefreshTokens table (decision §2.6).
```
