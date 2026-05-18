# AVACOM Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React 18 + TypeScript + Tailwind SPA that consumes the AVACOM backend API, with full JWT auth via httpOnly cookies, automatic token refresh, and ≥90% test coverage.

**Architecture:** Vite-bundled SPA deployed to a private S3 bucket behind a single CloudFront distribution. CloudFront routes `/*` to S3 (React app) and `/api/*` to API Gateway (backend). Same-origin design = SameSite=Strict cookies and zero CORS configuration. Auth state held in React Context. Data fetching via TanStack Query. Forms via react-hook-form + Zod.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Tailwind CSS 3, React Router 6, TanStack Query 5, Axios, react-hook-form, Zod, Vitest, @testing-library/react, MSW, AWS SAM (CloudFront stack).

**Prerequisites:** Backend deployed (see [`2026-05-17-avacom-backend.md`](./2026-05-17-avacom-backend.md)). You have the API Gateway URL from `sam list stack-outputs --stack-name avacom`.

**Spec reference:** [`../specs/2026-05-17-avacom-fullstack-design.md`](../specs/2026-05-17-avacom-fullstack-design.md)
**Diagrams reference:** [`../../diagrams/README.md`](../../diagrams/README.md)

---

## Phase 0: Project Setup

### Task 0.1: Scaffold Vite + React + TypeScript

**Files:**
- Create: `frontend/` (everything below)

- [ ] **Step 1: From repo root, scaffold Vite**

```bash
cd /c/Users/User/Desktop/avacomProjecto
npm create vite@latest frontend -- --template react-ts
cd frontend
```

- [ ] **Step 2: Install base dependencies**

```bash
npm install
npm install react-router-dom @tanstack/react-query axios \
  react-hook-form @hookform/resolvers zod
```

- [ ] **Step 3: Install Tailwind v3**

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 4: Install test deps**

```bash
npm install -D vitest @vitest/coverage-v8 @vitest/ui jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  msw @types/node
```

- [ ] **Step 5: Verify**

```bash
npm list --depth=0
```

Expected: no UNMET DEPENDENCY warnings.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore(frontend): scaffold Vite + React + TypeScript and install dependencies"
```

---

### Task 0.2: Configure Tailwind + Vite + TypeScript

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json` (if missing)
- Create: `frontend/src/vite-env.d.ts` (if missing — usually exists)
- Create: `frontend/.env.development`
- Create: `frontend/.env.production`

- [ ] **Step 1: Replace `tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { font-family: 'Inter', system-ui, sans-serif; }
  body { @apply bg-slate-50 text-slate-900 antialiased; }
}

@layer components {
  .input-base {
    @apply w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm
           focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
  }
  .btn-primary {
    @apply inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2
           text-sm font-medium text-white shadow-sm hover:bg-brand-700
           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
           disabled:opacity-50 disabled:pointer-events-none;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center rounded-md border border-slate-300 bg-white
           px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50
           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2;
  }
}
```

- [ ] **Step 3: Replace `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query', 'axios'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.tsx',
        '**/*.test.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/__tests__/**',
        '**/types.ts',
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

- [ ] **Step 4: Replace `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Create `.env.development`**

```env
VITE_API_URL=/api
```

- [ ] **Step 6: Create `.env.production`**

```env
VITE_API_URL=/api
```

- [ ] **Step 7: Verify build works**

```bash
npm run build
```

Expected: `dist/` created, contains `index.html` + `assets/`. Build completes.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore(frontend): configure Tailwind, Vite proxy, TypeScript, and Vitest"
```

---

### Task 0.3: Test setup file + MSW handlers scaffold

**Files:**
- Create: `frontend/src/__tests__/setup.ts`
- Create: `frontend/src/__tests__/msw/handlers.ts`
- Create: `frontend/src/__tests__/msw/server.ts`
- Create: `frontend/src/__tests__/test-utils.tsx`

- [ ] **Step 1: Create `src/__tests__/setup.ts`**

```typescript
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 2: Create `src/__tests__/msw/handlers.ts`**

```typescript
import { http, HttpResponse } from 'msw';

const API = '/api';

export const handlers = [
  http.post(`${API}/auth/signup`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string; name: string };
    if (body.email === 'dup@x.com') return HttpResponse.json({ error: { code: 'CONFLICT', message: 'Email exists' } }, { status: 409 });
    return HttpResponse.json(
      { user: { userId: 'u-1', email: body.email, name: body.name } },
      { status: 201, headers: { 'Set-Cookie': 'access_token=AT; HttpOnly' } },
    );
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.password === 'wrongpass') return HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid' } }, { status: 401 });
    return HttpResponse.json(
      { user: { userId: 'u-1', email: body.email, name: 'Logged In' } },
      { status: 200 },
    );
  }),

  http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 204 })),
  http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${API}/auth/me`, () => HttpResponse.json({
    user: { userId: 'u-1', email: 'me@x.com', name: 'Me' },
  })),

  http.get(`${API}/evaluations`, () => HttpResponse.json({
    items: [
      { evaluationId: 'e1', userId: 'u-1', courseId: 'CS101', title: 'Eval 1', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active', createdAt: '2026-05-17T10:00:00.000Z', updatedAt: '2026-05-17T10:00:00.000Z', deletedAt: null },
    ],
    nextCursor: null,
  })),

  http.get(`${API}/evaluations/:id`, ({ params }) => HttpResponse.json({
    evaluation: { evaluationId: params.id, userId: 'u-1', courseId: 'CS101', title: 'Eval', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active', createdAt: '2026-05-17T10:00:00.000Z', updatedAt: '2026-05-17T10:00:00.000Z', deletedAt: null },
  })),

  http.post(`${API}/evaluations`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      evaluation: { evaluationId: 'new-id', userId: 'u-1', ...body, createdAt: '2026', updatedAt: '2026', deletedAt: null },
    }, { status: 201 });
  }),

  http.put(`${API}/evaluations/:id`, async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      evaluation: { evaluationId: params.id, userId: 'u-1', courseId: 'CS101', description: 'd', dueDate: '2026', status: 'active', ...body, createdAt: '2026', updatedAt: '2026', deletedAt: null },
    });
  }),

  http.delete(`${API}/evaluations/:id`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${API}/health`, () => HttpResponse.json({ status: 'ok', version: 'test', uptime: 1 })),
];
```

- [ ] **Step 3: Create `src/__tests__/msw/server.ts`**

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

- [ ] **Step 4: Create `src/__tests__/test-utils.tsx`**

```typescript
import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

interface AllProvidersProps {
  children: ReactNode;
  initialEntries?: string[];
  queryClient?: QueryClient;
}

export function AllProviders({ children, initialEntries = ['/'], queryClient }: AllProvidersProps) {
  const qc = queryClient ?? makeQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialEntries?: string[]; queryClient?: QueryClient },
) {
  const { initialEntries, queryClient, ...rest } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries} queryClient={queryClient}>{children}</AllProviders>
    ),
    ...rest,
  });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
```

- [ ] **Step 5: Verify Vitest config picks up setup**

```bash
npx vitest run
```

Expected: "No tests found" (no test files yet — that's fine).

- [ ] **Step 6: Commit**

```bash
git add src/__tests__/
git commit -m "chore(frontend): configure MSW, test setup, and providers helper"
```

---

## Phase 1: Auth Foundation

### Task 1.1: Axios instance with refresh interceptor (TDD)

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/__tests__/api.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/__tests__/api.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/msw/server';

// Lazy import to ensure module is fresh per test
async function freshApi() {
  vi.resetModules();
  return (await import('../api')).api;
}

describe('api with refresh interceptor', () => {
  beforeEach(() => server.resetHandlers());

  it('retries the original request after a successful refresh on 401', async () => {
    let call = 0;
    server.use(
      http.get('/api/evaluations', () => {
        call += 1;
        return call === 1
          ? HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
          : HttpResponse.json({ items: [], nextCursor: null });
      }),
      http.post('/api/auth/refresh', () => new HttpResponse(null, { status: 204 })),
    );

    const api = await freshApi();
    const r = await api.get('/evaluations');
    expect(r.status).toBe(200);
    expect(call).toBe(2);
  });

  it('does not retry if refresh also fails', async () => {
    server.use(
      http.get('/api/evaluations', () => HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })),
      http.post('/api/auth/refresh', () => HttpResponse.json({ error: {} }, { status: 401 })),
    );
    const api = await freshApi();
    await expect(api.get('/evaluations')).rejects.toThrowError();
  });

  it('shares a single refresh call across concurrent 401s', async () => {
    let refreshCalls = 0;
    let firstAttempts = { a: 0, b: 0 };
    server.use(
      http.get('/api/a', () => {
        firstAttempts.a += 1;
        return firstAttempts.a === 1
          ? HttpResponse.json({}, { status: 401 })
          : HttpResponse.json({ ok: 'a' });
      }),
      http.get('/api/b', () => {
        firstAttempts.b += 1;
        return firstAttempts.b === 1
          ? HttpResponse.json({}, { status: 401 })
          : HttpResponse.json({ ok: 'b' });
      }),
      http.post('/api/auth/refresh', () => {
        refreshCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const api = await freshApi();
    const [a, b] = await Promise.all([api.get('/a'), api.get('/b')]);
    expect(a.data).toEqual({ ok: 'a' });
    expect(b.data).toEqual({ ok: 'b' });
    expect(refreshCalls).toBe(1);
  });

  it('does not refresh on non-401 errors', async () => {
    let refreshCalls = 0;
    server.use(
      http.get('/api/x', () => HttpResponse.json({}, { status: 500 })),
      http.post('/api/auth/refresh', () => { refreshCalls += 1; return new HttpResponse(null, { status: 204 }); }),
    );
    const api = await freshApi();
    await expect(api.get('/x')).rejects.toThrowError();
    expect(refreshCalls).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to see them fail**

```bash
npx vitest run src/lib/__tests__/api.test.ts
```

Expected: failures with "Cannot find module '../api'".

- [ ] **Step 3: Implement `src/lib/api.ts`**

```typescript
// src/lib/api.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

interface RetriableRequest extends AxiosRequestConfig { _retried?: boolean; }

let refreshPromise: Promise<void> | null = null;

async function performRefresh(): Promise<void> {
  refreshPromise ??= axios.post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
    .then(() => undefined)
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;
    if (!original || error.response?.status !== 401 || original._retried) {
      throw error;
    }
    const isAuthPath = (original.url ?? '').includes('/auth/');
    if (isAuthPath) throw error;
    original._retried = true;
    try { await performRefresh(); } catch { throw error; }
    return api(original);
  },
);
```

- [ ] **Step 4: Run and verify pass**

```bash
npx vitest run src/lib/__tests__/api.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/lib/__tests__/api.test.ts
git commit -m "feat(frontend): add axios instance with single-flight refresh interceptor"
```

---

### Task 1.2: AuthProvider + useAuth hook

**Files:**
- Create: `frontend/src/auth/AuthProvider.tsx`
- Create: `frontend/src/auth/useAuth.ts`
- Create: `frontend/src/auth/__tests__/AuthProvider.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/auth/__tests__/AuthProvider.test.tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/msw/server';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import { AuthProvider } from '../AuthProvider';
import { useAuth } from '../useAuth';

function Probe() {
  const { user, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'yes' : 'no'}</span>
      <span data-testid="user">{user ? user.email : 'anon'}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  it('starts in loading, then resolves to user on /me success', async () => {
    renderWithProviders(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByTestId('loading')).toHaveTextContent('yes');
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('no'));
    expect(screen.getByTestId('user')).toHaveTextContent('me@x.com');
  });

  it('resolves to anon when /me returns 401', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({}, { status: 401 })));
    renderWithProviders(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('no'));
    expect(screen.getByTestId('user')).toHaveTextContent('anon');
  });
});
```

- [ ] **Step 2: Run to see failures**

```bash
npx vitest run src/auth/__tests__/AuthProvider.test.tsx
```

Expected: failures.

- [ ] **Step 3: Implement `AuthProvider.tsx`**

```typescript
// src/auth/AuthProvider.tsx
import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

export interface User { userId: string; email: string; name: string; }

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => ({ user, isLoading, setUser, refresh }), [user, isLoading, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

- [ ] **Step 4: Implement `useAuth.ts`**

```typescript
// src/auth/useAuth.ts
import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthProvider';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 5: Run and verify**

```bash
npx vitest run src/auth/__tests__/AuthProvider.test.tsx
```

Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add src/auth/AuthProvider.tsx src/auth/useAuth.ts src/auth/__tests__/
git commit -m "feat(frontend): add AuthProvider with /me bootstrap"
```

---

### Task 1.3: ProtectedRoute

**Files:**
- Create: `frontend/src/auth/ProtectedRoute.tsx`
- Create: `frontend/src/auth/__tests__/ProtectedRoute.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/auth/__tests__/ProtectedRoute.test.tsx
import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/msw/server';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import { AuthProvider } from '../AuthProvider';
import { ProtectedRoute } from '../ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<div>Secret content</div>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', async () => {
    renderWithProviders(<App />, { initialEntries: ['/secret'] });
    await waitFor(() => expect(screen.getByText('Secret content')).toBeInTheDocument());
  });

  it('redirects to /login when user is null', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({}, { status: 401 })));
    renderWithProviders(<App />, { initialEntries: ['/secret'] });
    await waitFor(() => expect(screen.getByText('Login screen')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Implement `ProtectedRoute.tsx`**

```typescript
// src/auth/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
```

- [ ] **Step 3: Run and verify**

```bash
npx vitest run src/auth/__tests__/ProtectedRoute.test.tsx
```

Expected: 2 passed. (Will fail until LoadingSpinner exists — create as stub now.)

- [ ] **Step 4: Stub `LoadingSpinner.tsx`** (full impl in Phase 2)

```typescript
// src/components/LoadingSpinner.tsx
export function LoadingSpinner() {
  return <div role="status" aria-label="Loading">Loading...</div>;
}
```

- [ ] **Step 5: Re-run**

```bash
npx vitest run src/auth/__tests__/
```

Expected: 4 passed (all auth tests).

- [ ] **Step 6: Commit**

```bash
git add src/auth/ProtectedRoute.tsx src/auth/__tests__/ProtectedRoute.test.tsx src/components/LoadingSpinner.tsx
git commit -m "feat(frontend): add ProtectedRoute guard and LoadingSpinner stub"
```

---

## Phase 2: Atomic UI Components

### Task 2.1: Button, Input, Select, Modal, Toast — with tests

**Files:**
- Create: `frontend/src/components/Button.tsx` (+ test)
- Create: `frontend/src/components/Input.tsx` (+ test)
- Create: `frontend/src/components/Select.tsx` (+ test)
- Create: `frontend/src/components/Modal.tsx` (+ test)
- Create: `frontend/src/components/Toast.tsx` + `ToastProvider.tsx` (+ test)
- Modify: `frontend/src/components/LoadingSpinner.tsx` (already stubbed) — add styles

> Each component follows the same pattern: write failing test → implement → verify → commit. Showing the full pattern for `Button`; subsequent tasks are condensed.

- [ ] **Step 1: Write `Button.test.tsx`**

```typescript
// src/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not trigger onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders loading state with aria-busy', () => {
    render(<Button loading>Click</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
  });

  it('applies variant=secondary class', () => {
    render(<Button variant="secondary">x</Button>);
    expect(screen.getByRole('button').className).toMatch(/btn-secondary/);
  });
});
```

- [ ] **Step 2: Implement `Button.tsx`**

```typescript
// src/components/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading, disabled, children, className, ...rest }, ref,
) {
  const klass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
  return (
    <button
      ref={ref}
      className={`${klass} ${className ?? ''}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
});
```

- [ ] **Step 3: Run and verify**

```bash
npx vitest run src/components/__tests__/Button.test.tsx
```

Expected: 5 passed.

- [ ] **Step 4: Write `Input.test.tsx`**

```typescript
// src/components/__tests__/Input.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders label associated with input', () => {
    render(<Input label="Email" id="email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'email');
  });

  it('shows error message and aria-invalid', () => {
    render(<Input label="Email" id="email" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards onChange', async () => {
    let val = '';
    render(<Input label="x" id="x" onChange={(e) => { val = e.target.value; }} />);
    await userEvent.type(screen.getByLabelText('x'), 'hi');
    expect(val).toBe('hi');
  });
});
```

- [ ] **Step 5: Implement `Input.tsx`**

```typescript
// src/components/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, id, error, className, ...rest }, ref,
) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        ref={ref}
        id={id}
        className={`input-base ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
```

- [ ] **Step 6: Write `Select.test.tsx`**

```typescript
// src/components/__tests__/Select.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

describe('Select', () => {
  const options = [
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
  ];

  it('renders label and options', () => {
    render(<Select label="Fruit" id="fruit" options={options} />);
    expect(screen.getByLabelText('Fruit')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('fires onChange with new value', async () => {
    let val = '';
    render(<Select label="Fruit" id="fruit" options={options} onChange={(e) => { val = e.target.value; }} />);
    await userEvent.selectOptions(screen.getByLabelText('Fruit'), 'b');
    expect(val).toBe('b');
  });

  it('shows error', () => {
    render(<Select label="Fruit" id="fruit" options={options} error="pick one" />);
    expect(screen.getByText('pick one')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Implement `Select.tsx`**

```typescript
// src/components/Select.tsx
import { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectOption { value: string; label: string; }

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, id, options, error, placeholder, className, ...rest }, ref,
) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <select
        ref={ref}
        id={id}
        className={`input-base ${error ? 'border-red-500' : ''} ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
```

- [ ] **Step 8: Write `Modal.test.tsx`**

```typescript
// src/components/__tests__/Modal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders nothing when open is false', () => {
    render(<Modal open={false} onClose={() => {}} title="t"><p>body</p></Modal>);
    expect(screen.queryByText('body')).not.toBeInTheDocument();
  });

  it('renders title and body when open', () => {
    render(<Modal open onClose={() => {}} title="My title"><p>body</p></Modal>);
    expect(screen.getByText('My title')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="t"><p>x</p></Modal>);
    await userEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="t"><p>x</p></Modal>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 9: Implement `Modal.tsx`**

```typescript
// src/components/Modal.tsx
import { ReactNode, useEffect } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Toast — `ToastProvider.tsx` + `useToast.ts` + test**

```typescript
// src/components/ToastProvider.tsx
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface Toast { id: number; message: string; kind: 'success' | 'error'; }
interface ToastContextValue { show: (message: string, kind?: 'success' | 'error') => void; }

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 3000);
  }, []);

  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2" role="region" aria-label="Notifications">
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            className={`rounded-md px-4 py-2 text-sm shadow-lg ${
              t.kind === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
```

```typescript
// src/components/__tests__/ToastProvider.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../ToastProvider';

function Trigger() {
  const { show } = useToast();
  return (
    <>
      <button onClick={() => show('Hello!')}>OK</button>
      <button onClick={() => show('Boom', 'error')}>Fail</button>
    </>
  );
}

describe('ToastProvider', () => {
  it('shows toast after action', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>);
    await userEvent.click(screen.getByText('OK'));
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('shows error toast', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>);
    await userEvent.click(screen.getByText('Fail'));
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });
});
```

- [ ] **Step 11: Polish `LoadingSpinner.tsx`**

```typescript
// src/components/LoadingSpinner.tsx
export function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
```

```typescript
// src/components/__tests__/LoadingSpinner.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });
  it('renders with custom label', () => {
    render(<LoadingSpinner label="Fetching..." />);
    expect(screen.getByRole('status', { name: 'Fetching...' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 12: Run all component tests**

```bash
npx vitest run src/components/
```

Expected: ~20 tests passing.

- [ ] **Step 13: Commit**

```bash
git add src/components/
git commit -m "feat(frontend): add Button, Input, Select, Modal, Toast, LoadingSpinner with tests"
```

---

### Task 2.2: ErrorBoundary

**Files:**
- Create: `frontend/src/components/ErrorBoundary.tsx`
- Create: `frontend/src/components/__tests__/ErrorBoundary.test.tsx`

- [ ] **Step 1: Write the test**

```typescript
// src/components/__tests__/ErrorBoundary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const Boom = () => { throw new Error('kaboom'); };

describe('ErrorBoundary', () => {
  it('renders fallback when child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders children when no error', () => {
    render(<ErrorBoundary><span>OK</span></ErrorBoundary>);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface State { hasError: boolean; message: string; }
interface Props { children: ReactNode; fallback?: ReactNode; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', err, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return this.props.fallback ?? (
      <div role="alert" className="max-w-md mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-red-700 font-semibold">Something went wrong</h2>
        <p className="text-sm text-red-600 mt-2">{this.state.message}</p>
      </div>
    );
  }
}
```

- [ ] **Step 3: Verify and commit**

```bash
npx vitest run src/components/__tests__/ErrorBoundary.test.tsx
git add src/components/ErrorBoundary.tsx src/components/__tests__/ErrorBoundary.test.tsx
git commit -m "feat(frontend): add ErrorBoundary"
```

Expected: 2 passed.

---

## Phase 3: Auth Pages

### Task 3.1: LoginPage with form + tests

**Files:**
- Create: `frontend/src/auth/LoginPage.tsx`
- Create: `frontend/src/auth/__tests__/LoginPage.test.tsx`
- Create: `frontend/src/lib/schemas.ts`
- Create: `frontend/src/lib/__tests__/schemas.test.ts`

- [ ] **Step 1: Create shared Zod schemas**

```typescript
// src/lib/schemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email').trim().toLowerCase(),
  password: z.string().min(1, 'Password required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8, 'At least 8 characters').max(100),
  name: z.string().min(1, 'Name required').max(100).trim(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const evaluationStatusSchema = z.enum(['active', 'completed', 'cancelled']);

export const evaluationFormSchema = z.object({
  courseId: z.string().min(1, 'Course ID required').max(50),
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().max(2000),
  dueDate: z.string().min(1, 'Due date required'),
  status: evaluationStatusSchema,
});
export type EvaluationFormInput = z.infer<typeof evaluationFormSchema>;
```

- [ ] **Step 2: Write `schemas.test.ts`**

```typescript
// src/lib/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema, evaluationFormSchema } from '../schemas';

describe('schemas', () => {
  it('loginSchema accepts valid', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
  it('loginSchema rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'no-at', password: 'x' }).success).toBe(false);
  });
  it('signupSchema enforces 8-char password', () => {
    expect(signupSchema.safeParse({ email: 'a@b.com', password: 'short', name: 'A' }).success).toBe(false);
  });
  it('evaluationFormSchema requires title', () => {
    expect(evaluationFormSchema.safeParse({
      courseId: 'C', title: '', description: '', dueDate: '2026-06-01', status: 'active',
    }).success).toBe(false);
  });
});
```

- [ ] **Step 3: Write `LoginPage.test.tsx`**

```typescript
// src/auth/__tests__/LoginPage.test.tsx
import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../AuthProvider';
import { LoginPage } from '../LoginPage';
import { ToastProvider } from '../../components/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/evaluations" element={<div>Evaluations home</div>} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

describe('LoginPage', () => {
  it('renders email and password fields', async () => {
    renderWithProviders(<App />, { initialEntries: ['/login'] });
    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    renderWithProviders(<App />, { initialEntries: ['/login'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('navigates to /evaluations on successful login', async () => {
    renderWithProviders(<App />, { initialEntries: ['/login'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(screen.getByText('Evaluations home')).toBeInTheDocument());
  });

  it('shows error toast on 401', async () => {
    renderWithProviders(<App />, { initialEntries: ['/login'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(screen.getByText(/invalid/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 4: Implement `LoginPage.tsx`**

```typescript
// src/auth/LoginPage.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '../lib/schemas';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../lib/api';
import { useAuth } from './useAuth';
import { useToast } from '../components/ToastProvider';

export function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { show } = useToast();

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { data: resp } = await api.post<{ user: { userId: string; email: string; name: string } }>('/auth/login', data);
      setUser(resp.user);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/evaluations';
      navigate(from, { replace: true });
    } catch {
      show('Invalid email or password', 'error');
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-semibold text-slate-900">Log in</h1>
        <Input label="Email" id="email" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Password" id="password" type="password" {...register('password')} error={errors.password?.message} />
        <Button type="submit" loading={isSubmitting} className="w-full">Log in</Button>
        <p className="text-sm text-slate-600 text-center">
          No account? <Link to="/signup" className="text-brand-600 hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Run and verify**

```bash
npx vitest run src/auth/__tests__/LoginPage.test.tsx src/lib/__tests__/schemas.test.ts
```

Expected: ~8 passed.

- [ ] **Step 6: Commit**

```bash
git add src/auth/LoginPage.tsx src/lib/schemas.ts \
        src/auth/__tests__/LoginPage.test.tsx src/lib/__tests__/schemas.test.ts
git commit -m "feat(frontend): add LoginPage with form validation and toast feedback"
```

---

### Task 3.2: SignupPage

**Files:**
- Create: `frontend/src/auth/SignupPage.tsx`
- Create: `frontend/src/auth/__tests__/SignupPage.test.tsx`

- [ ] **Step 1: Write `SignupPage.test.tsx`**

```typescript
// src/auth/__tests__/SignupPage.test.tsx
import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../AuthProvider';
import { SignupPage } from '../SignupPage';
import { ToastProvider } from '../../components/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/evaluations" element={<div>Evaluations home</div>} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

describe('SignupPage', () => {
  it('renders email, password, and name fields', async () => {
    renderWithProviders(<App />, { initialEntries: ['/signup'] });
    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('shows 8-char minimum error', async () => {
    renderWithProviders(<App />, { initialEntries: ['/signup'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');
    await userEvent.type(screen.getByLabelText(/name/i), 'A');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/at least 8/i)).toBeInTheDocument();
  });

  it('shows duplicate email toast on 409', async () => {
    renderWithProviders(<App />, { initialEntries: ['/signup'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'dup@x.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/name/i), 'Dup');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/email/i)).toBeInTheDocument();
  });

  it('navigates to /evaluations on success', async () => {
    renderWithProviders(<App />, { initialEntries: ['/signup'] });
    await waitFor(() => screen.getByLabelText(/email/i));
    await userEvent.type(screen.getByLabelText(/email/i), 'new@x.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/name/i), 'New');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(screen.getByText('Evaluations home')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Implement `SignupPage.tsx`**

```typescript
// src/auth/SignupPage.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { signupSchema, type SignupInput } from '../lib/schemas';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../lib/api';
import { useAuth } from './useAuth';
import { useToast } from '../components/ToastProvider';

export function SignupPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { data: resp } = await api.post<{ user: { userId: string; email: string; name: string } }>('/auth/signup', data);
      setUser(resp.user);
      navigate('/evaluations', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.status === 409 ? 'Email already registered' : 'Could not sign up';
      show(msg, 'error');
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-semibold text-slate-900">Sign up</h1>
        <Input label="Name" id="name" {...register('name')} error={errors.name?.message} />
        <Input label="Email" id="email" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Password" id="password" type="password" {...register('password')} error={errors.password?.message} />
        <Button type="submit" loading={isSubmitting} className="w-full">Sign up</Button>
        <p className="text-sm text-slate-600 text-center">
          Have an account? <Link to="/login" className="text-brand-600 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Run and verify**

```bash
npx vitest run src/auth/__tests__/SignupPage.test.tsx
```

Expected: 4 passed.

- [ ] **Step 4: Commit**

```bash
git add src/auth/SignupPage.tsx src/auth/__tests__/SignupPage.test.tsx
git commit -m "feat(frontend): add SignupPage with validation"
```

---

## Phase 4: Evaluations CRUD

### Task 4.1: Evaluation hooks (TanStack Query mutations + queries)

**Files:**
- Create: `frontend/src/evaluations/types.ts`
- Create: `frontend/src/evaluations/hooks/useEvaluations.ts`
- Create: `frontend/src/evaluations/hooks/useEvaluation.ts`
- Create: `frontend/src/evaluations/hooks/useCreateEvaluation.ts`
- Create: `frontend/src/evaluations/hooks/useUpdateEvaluation.ts`
- Create: `frontend/src/evaluations/hooks/useDeleteEvaluation.ts`
- Create: tests for each in `__tests__/`

- [ ] **Step 1: Create `types.ts`**

```typescript
// src/evaluations/types.ts
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

export interface CreateEvaluationInput {
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: EvaluationStatus;
}
export type UpdateEvaluationInput = Partial<CreateEvaluationInput>;
```

- [ ] **Step 2: Write `useEvaluations.test.tsx`**

```typescript
// src/evaluations/hooks/__tests__/useEvaluations.test.tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../../../__tests__/msw/server';
import { useEvaluations } from '../useEvaluations';

function wrapper(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useEvaluations', () => {
  it('returns items from the API', async () => {
    const { result } = renderHook(() => useEvaluations({}), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
  });

  it('passes filters as query params', async () => {
    let queriedStatus: string | null = null;
    server.use(http.get('/api/evaluations', ({ request }) => {
      queriedStatus = new URL(request.url).searchParams.get('status');
      return HttpResponse.json({ items: [], nextCursor: null });
    }));
    const { result } = renderHook(() => useEvaluations({ status: 'active' }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queriedStatus).toBe('active');
  });
});
```

- [ ] **Step 3: Implement `useEvaluations.ts`**

```typescript
// src/evaluations/hooks/useEvaluations.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { ListFilters, PaginatedEvaluations } from '../types';

export function useEvaluations(filters: ListFilters) {
  return useQuery({
    queryKey: ['evaluations', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedEvaluations>('/evaluations', { params: filters });
      return data;
    },
    staleTime: 30_000,
  });
}
```

- [ ] **Step 4: Write `useEvaluation.test.tsx` + implement**

```typescript
// src/evaluations/hooks/__tests__/useEvaluation.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvaluation } from '../useEvaluation';

function wrapper() {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={c}>{children}</QueryClientProvider>;
}

describe('useEvaluation', () => {
  it('fetches by id', async () => {
    const { result } = renderHook(() => useEvaluation('xyz'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.evaluationId).toBe('xyz');
  });

  it('is disabled when id is empty', () => {
    const { result } = renderHook(() => useEvaluation(''), { wrapper: wrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
```

```typescript
// src/evaluations/hooks/useEvaluation.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Evaluation } from '../types';

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: ['evaluations', id],
    queryFn: async () => {
      const { data } = await api.get<{ evaluation: Evaluation }>(`/evaluations/${id}`);
      return data.evaluation;
    },
    enabled: id !== '',
  });
}
```

- [ ] **Step 5: Write `useCreateEvaluation.test.tsx` + implement**

```typescript
// src/evaluations/hooks/__tests__/useCreateEvaluation.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateEvaluation } from '../useCreateEvaluation';

describe('useCreateEvaluation', () => {
  it('invalidates ["evaluations"] on success', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateEvaluation(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    await act(async () => {
      await result.current.mutateAsync({
        courseId: 'c', title: 't', description: 'd',
        dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
      });
    });
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ['evaluations'] }));
  });
});
```

```typescript
// src/evaluations/hooks/useCreateEvaluation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { CreateEvaluationInput, Evaluation } from '../types';

export function useCreateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEvaluationInput) => {
      const { data } = await api.post<{ evaluation: Evaluation }>('/evaluations', input);
      return data.evaluation;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evaluations'] }); },
  });
}
```

- [ ] **Step 6: Implement `useUpdateEvaluation.ts` + test**

```typescript
// src/evaluations/hooks/useUpdateEvaluation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Evaluation, UpdateEvaluationInput } from '../types';

interface Args { id: string; patch: UpdateEvaluationInput; }

export function useUpdateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: Args) => {
      const { data } = await api.put<{ evaluation: Evaluation }>(`/evaluations/${id}`, patch);
      return data.evaluation;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evaluations'] }); },
  });
}
```

```typescript
// src/evaluations/hooks/__tests__/useUpdateEvaluation.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateEvaluation } from '../useUpdateEvaluation';

describe('useUpdateEvaluation', () => {
  it('updates and returns the patched evaluation', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useUpdateEvaluation(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    let updated;
    await act(async () => { updated = await result.current.mutateAsync({ id: 'xyz', patch: { title: 'new' } }); });
    expect((updated as any).title).toBe('new');
  });
});
```

- [ ] **Step 7: Implement `useDeleteEvaluation.ts` + test**

```typescript
// src/evaluations/hooks/useDeleteEvaluation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useDeleteEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/evaluations/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evaluations'] }); },
  });
}
```

```typescript
// src/evaluations/hooks/__tests__/useDeleteEvaluation.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteEvaluation } from '../useDeleteEvaluation';

describe('useDeleteEvaluation', () => {
  it('invalidates evaluations cache on success', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteEvaluation(), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });
    await act(async () => { await result.current.mutateAsync('xyz'); });
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ['evaluations'] }));
  });
});
```

- [ ] **Step 8: Run all hook tests**

```bash
npx vitest run src/evaluations/hooks/
```

Expected: ~8 passed.

- [ ] **Step 9: Commit**

```bash
git add src/evaluations/
git commit -m "feat(frontend): add TanStack Query hooks for evaluations CRUD"
```

---

### Task 4.2: EvaluationForm component

**Files:**
- Create: `frontend/src/evaluations/EvaluationForm.tsx`
- Create: `frontend/src/evaluations/__tests__/EvaluationForm.test.tsx`

- [ ] **Step 1: Write the test**

```typescript
// src/evaluations/__tests__/EvaluationForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvaluationForm } from '../EvaluationForm';

describe('EvaluationForm', () => {
  it('renders all fields', () => {
    render(<EvaluationForm onSubmit={vi.fn()} submitting={false} />);
    expect(screen.getByLabelText(/course id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it('pre-fills initialValues in edit mode', () => {
    render(<EvaluationForm onSubmit={vi.fn()} submitting={false} initialValues={{
      courseId: 'CS101', title: 'Pre', description: 'd', dueDate: '2026-06-01T12:00', status: 'completed',
    }} />);
    expect(screen.getByLabelText(/course id/i)).toHaveValue('CS101');
    expect(screen.getByLabelText(/title/i)).toHaveValue('Pre');
  });

  it('shows validation error on empty title', async () => {
    render(<EvaluationForm onSubmit={vi.fn()} submitting={false} />);
    await userEvent.type(screen.getByLabelText(/course id/i), 'CS101');
    await userEvent.type(screen.getByLabelText(/due date/i), '2026-06-01T12:00');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/title required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn();
    render(<EvaluationForm onSubmit={onSubmit} submitting={false} />);
    await userEvent.type(screen.getByLabelText(/course id/i), 'CS101');
    await userEvent.type(screen.getByLabelText(/title/i), 'Title');
    await userEvent.type(screen.getByLabelText(/description/i), 'Desc');
    await userEvent.type(screen.getByLabelText(/due date/i), '2026-06-01T12:00');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      courseId: 'CS101', title: 'Title', description: 'Desc', status: 'active',
    });
  });

  it('disables submit while submitting', () => {
    render(<EvaluationForm onSubmit={vi.fn()} submitting initialValues={{
      courseId: 'C', title: 'T', description: '', dueDate: '2026-06-01T12:00', status: 'active',
    }} />);
    expect(screen.getByRole('button', { name: /save|loading/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Implement `EvaluationForm.tsx`**

```typescript
// src/evaluations/EvaluationForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { evaluationFormSchema, type EvaluationFormInput } from '../lib/schemas';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';

interface Props {
  initialValues?: EvaluationFormInput;
  submitting: boolean;
  onSubmit: (data: EvaluationFormInput) => void | Promise<void>;
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function EvaluationForm({ initialValues, submitting, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<EvaluationFormInput>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: initialValues ?? { courseId: '', title: '', description: '', dueDate: '', status: 'active' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <Input label="Course ID" id="courseId" {...register('courseId')} error={errors.courseId?.message} />
      <Input label="Title" id="title" {...register('title')} error={errors.title?.message} />
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          id="description"
          rows={4}
          className="input-base"
          {...register('description')}
        />
        {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
      </div>
      <Input label="Due Date" id="dueDate" type="datetime-local" {...register('dueDate')} error={errors.dueDate?.message} />
      <Select label="Status" id="status" options={statusOptions} {...register('status')} error={errors.status?.message} />
      <Button type="submit" loading={submitting}>Save</Button>
    </form>
  );
}
```

- [ ] **Step 3: Run and verify**

```bash
npx vitest run src/evaluations/__tests__/EvaluationForm.test.tsx
```

Expected: 5 passed.

- [ ] **Step 4: Commit**

```bash
git add src/evaluations/EvaluationForm.tsx src/evaluations/__tests__/EvaluationForm.test.tsx
git commit -m "feat(frontend): add EvaluationForm component"
```

---

### Task 4.3: FiltersBar, EvaluationsTable, DeleteConfirmDialog

**Files:**
- Create: `frontend/src/evaluations/FiltersBar.tsx` (+ test)
- Create: `frontend/src/evaluations/EvaluationsTable.tsx` (+ test)
- Create: `frontend/src/evaluations/DeleteConfirmDialog.tsx` (+ test)

- [ ] **Step 1: Implement `FiltersBar.tsx` and test**

```typescript
// src/evaluations/FiltersBar.tsx
import { Select } from '../components/Select';
import { Input } from '../components/Input';
import type { EvaluationStatus } from './types';

interface Props {
  status?: EvaluationStatus;
  courseId?: string;
  onChange: (next: { status?: EvaluationStatus; courseId?: string }) => void;
}

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function FiltersBar({ status, courseId, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="w-48">
        <Select
          label="Status"
          id="filter-status"
          options={statusOptions}
          value={status ?? ''}
          onChange={(e) => onChange({ status: (e.target.value || undefined) as EvaluationStatus | undefined, courseId })}
        />
      </div>
      <div className="w-48">
        <Input
          label="Course ID"
          id="filter-course"
          value={courseId ?? ''}
          onChange={(e) => onChange({ status, courseId: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
```

```typescript
// src/evaluations/__tests__/FiltersBar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FiltersBar } from '../FiltersBar';

describe('FiltersBar', () => {
  it('emits status changes', async () => {
    const onChange = vi.fn();
    render(<FiltersBar onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'active');
    expect(onChange).toHaveBeenCalledWith({ status: 'active', courseId: undefined });
  });

  it('emits courseId changes', async () => {
    const onChange = vi.fn();
    render(<FiltersBar onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Course ID'), 'C');
    expect(onChange).toHaveBeenLastCalledWith({ status: undefined, courseId: 'C' });
  });
});
```

- [ ] **Step 2: Implement `EvaluationsTable.tsx` and test**

```typescript
// src/evaluations/EvaluationsTable.tsx
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import type { Evaluation } from './types';

interface Props {
  items: Evaluation[];
  onDelete: (id: string) => void;
}

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function EvaluationsTable({ items, onDelete }: Props) {
  if (items.length === 0) {
    return <p className="text-slate-500 italic">No evaluations yet. Create your first one.</p>;
  }
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left text-slate-600 border-b border-slate-200">
          <th className="py-2 pr-4">Title</th>
          <th className="py-2 pr-4">Course</th>
          <th className="py-2 pr-4">Due</th>
          <th className="py-2 pr-4">Status</th>
          <th className="py-2 pr-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((e) => (
          <tr key={e.evaluationId} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-2 pr-4 font-medium text-slate-900">{e.title}</td>
            <td className="py-2 pr-4">{e.courseId}</td>
            <td className="py-2 pr-4">{new Date(e.dueDate).toLocaleString()}</td>
            <td className="py-2 pr-4">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${statusBadge[e.status]}`}>{e.status}</span>
            </td>
            <td className="py-2 pr-4 text-right space-x-2">
              <Link to={`/evaluations/${e.evaluationId}/edit`} className="text-brand-600 hover:underline text-sm">Edit</Link>
              <button onClick={() => onDelete(e.evaluationId)} className="text-red-600 hover:underline text-sm">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

```typescript
// src/evaluations/__tests__/EvaluationsTable.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvaluationsTable } from '../EvaluationsTable';

const items = [
  { evaluationId: '1', userId: 'u', courseId: 'CS101', title: 'A', description: 'd', dueDate: '2026-06-01T12:00:00.000Z', status: 'active', createdAt: '', updatedAt: '', deletedAt: null },
] as any;

describe('EvaluationsTable', () => {
  it('shows empty state', () => {
    render(<MemoryRouter><EvaluationsTable items={[]} onDelete={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText(/no evaluations/i)).toBeInTheDocument();
  });
  it('renders rows', () => {
    render(<MemoryRouter><EvaluationsTable items={items} onDelete={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('CS101')).toBeInTheDocument();
  });
  it('calls onDelete', async () => {
    const onDelete = vi.fn();
    render(<MemoryRouter><EvaluationsTable items={items} onDelete={onDelete} /></MemoryRouter>);
    await userEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
```

- [ ] **Step 3: Implement `DeleteConfirmDialog.tsx` and test**

```typescript
// src/evaluations/DeleteConfirmDialog.tsx
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';

interface Props {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteConfirmDialog({ open, title, onConfirm, onCancel, loading }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title="Delete evaluation">
      <p className="text-sm text-slate-700 mb-4">
        Are you sure you want to delete <span className="font-semibold">{title}</span>? This action can be reversed by support.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} loading={loading} className="!bg-red-600 hover:!bg-red-700">Delete</Button>
      </div>
    </Modal>
  );
}
```

```typescript
// src/evaluations/__tests__/DeleteConfirmDialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(<DeleteConfirmDialog open={false} title="X" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText(/delete evaluation/i)).not.toBeInTheDocument();
  });
  it('confirms when Delete clicked', async () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmDialog open title="My Eval" onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(onConfirm).toHaveBeenCalled();
  });
  it('cancels when Cancel clicked', async () => {
    const onCancel = vi.fn();
    render(<DeleteConfirmDialog open title="My Eval" onConfirm={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run and commit**

```bash
npx vitest run src/evaluations/__tests__/
git add src/evaluations/FiltersBar.tsx src/evaluations/EvaluationsTable.tsx src/evaluations/DeleteConfirmDialog.tsx \
        src/evaluations/__tests__/
git commit -m "feat(frontend): add FiltersBar, EvaluationsTable, DeleteConfirmDialog"
```

Expected: ~8 passed.

---

### Task 4.4: EvaluationsListPage and EvaluationFormPage

**Files:**
- Create: `frontend/src/evaluations/EvaluationsListPage.tsx`
- Create: `frontend/src/evaluations/EvaluationFormPage.tsx`
- Create: `frontend/src/evaluations/__tests__/EvaluationsListPage.test.tsx`
- Create: `frontend/src/evaluations/__tests__/EvaluationFormPage.test.tsx`

- [ ] **Step 1: Implement `EvaluationsListPage.tsx`**

```typescript
// src/evaluations/EvaluationsListPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useEvaluations } from './hooks/useEvaluations';
import { useDeleteEvaluation } from './hooks/useDeleteEvaluation';
import { FiltersBar } from './FiltersBar';
import { EvaluationsTable } from './EvaluationsTable';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useToast } from '../components/ToastProvider';
import type { EvaluationStatus } from './types';

export function EvaluationsListPage() {
  const [filters, setFilters] = useState<{ status?: EvaluationStatus; courseId?: string }>({});
  const { data, isLoading, isError, refetch } = useEvaluations(filters);
  const deleteMut = useDeleteEvaluation();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const { show } = useToast();

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      show('Evaluation deleted', 'success');
    } catch {
      show('Could not delete', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Evaluations</h1>
        <Link to="/evaluations/new" className="btn-primary">New evaluation</Link>
      </div>

      <FiltersBar status={filters.status} courseId={filters.courseId} onChange={setFilters} />

      {isLoading && <LoadingSpinner />}
      {isError && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-red-700">Could not load evaluations.</p>
          <Button variant="secondary" onClick={() => refetch()} className="mt-2">Retry</Button>
        </div>
      )}
      {data && (
        <EvaluationsTable
          items={data.items}
          onDelete={(id) => {
            const item = data.items.find(i => i.evaluationId === id);
            if (item) setDeleteTarget({ id, title: item.title });
          }}
        />
      )}

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.title ?? ''}
        loading={deleteMut.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Implement `EvaluationFormPage.tsx`**

```typescript
// src/evaluations/EvaluationFormPage.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EvaluationForm } from './EvaluationForm';
import { useEvaluation } from './hooks/useEvaluation';
import { useCreateEvaluation } from './hooks/useCreateEvaluation';
import { useUpdateEvaluation } from './hooks/useUpdateEvaluation';
import { useToast } from '../components/ToastProvider';
import type { EvaluationFormInput } from '../lib/schemas';

interface Props { mode: 'create' | 'edit'; }

export function EvaluationFormPage({ mode }: Props) {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const id = params.id ?? '';

  const eval$ = useEvaluation(mode === 'edit' ? id : '');
  const createMut = useCreateEvaluation();
  const updateMut = useUpdateEvaluation();

  if (mode === 'edit' && eval$.isLoading) return <LoadingSpinner />;
  if (mode === 'edit' && eval$.isError) return <p className="p-6 text-red-600">Could not load evaluation.</p>;

  async function onSubmit(data: EvaluationFormInput) {
    try {
      if (mode === 'create') {
        await createMut.mutateAsync(data);
        show('Created', 'success');
      } else {
        await updateMut.mutateAsync({ id, patch: data });
        show('Updated', 'success');
      }
      navigate('/evaluations');
    } catch {
      show('Save failed', 'error');
    }
  }

  const initial: EvaluationFormInput | undefined = mode === 'edit' && eval$.data
    ? {
        courseId: eval$.data.courseId,
        title: eval$.data.title,
        description: eval$.data.description,
        dueDate: eval$.data.dueDate.slice(0, 16),
        status: eval$.data.status,
      }
    : undefined;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        {mode === 'create' ? 'New evaluation' : 'Edit evaluation'}
      </h1>
      <EvaluationForm
        initialValues={initial}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={onSubmit}
      />
    </div>
  );
}
```

- [ ] **Step 3: Write `EvaluationsListPage.test.tsx`**

```typescript
// src/evaluations/__tests__/EvaluationsListPage.test.tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '../../__tests__/msw/server';
import { ToastProvider } from '../../components/ToastProvider';
import { EvaluationsListPage } from '../EvaluationsListPage';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/evaluations" element={<EvaluationsListPage />} />
      </Routes>
    </ToastProvider>
  );
}

describe('EvaluationsListPage', () => {
  it('shows loading then table', async () => {
    renderWithProviders(<App />, { initialEntries: ['/evaluations'] });
    await waitFor(() => expect(screen.getByText('Eval 1')).toBeInTheDocument());
  });

  it('shows empty state when API returns no items', async () => {
    server.use(http.get('/api/evaluations', () => HttpResponse.json({ items: [], nextCursor: null })));
    renderWithProviders(<App />, { initialEntries: ['/evaluations'] });
    await waitFor(() => expect(screen.getByText(/no evaluations/i)).toBeInTheDocument());
  });

  it('shows error state and recovers on retry', async () => {
    let attempts = 0;
    server.use(http.get('/api/evaluations', () => {
      attempts += 1;
      return attempts === 1
        ? HttpResponse.json({}, { status: 500 })
        : HttpResponse.json({ items: [], nextCursor: null });
    }));
    renderWithProviders(<App />, { initialEntries: ['/evaluations'] });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(screen.getByText(/no evaluations/i)).toBeInTheDocument());
  });

  it('opens delete dialog and confirms delete', async () => {
    renderWithProviders(<App />, { initialEntries: ['/evaluations'] });
    await waitFor(() => screen.getByText('Eval 1'));
    await userEvent.click(screen.getByText('Delete'));
    expect(await screen.findByText(/are you sure/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument());
  });
});
```

- [ ] **Step 4: Write `EvaluationFormPage.test.tsx`**

```typescript
// src/evaluations/__tests__/EvaluationFormPage.test.tsx
import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../components/ToastProvider';
import { EvaluationFormPage } from '../EvaluationFormPage';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/evaluations" element={<div>list</div>} />
        <Route path="/evaluations/new" element={<EvaluationFormPage mode="create" />} />
        <Route path="/evaluations/:id/edit" element={<EvaluationFormPage mode="edit" />} />
      </Routes>
    </ToastProvider>
  );
}

describe('EvaluationFormPage', () => {
  it('create mode renders empty form and submits', async () => {
    renderWithProviders(<App />, { initialEntries: ['/evaluations/new'] });
    expect(await screen.findByText('New evaluation')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/course id/i), 'CS101');
    await userEvent.type(screen.getByLabelText(/title/i), 'T');
    await userEvent.type(screen.getByLabelText(/description/i), 'D');
    await userEvent.type(screen.getByLabelText(/due date/i), '2026-06-01T12:00');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText('list')).toBeInTheDocument());
  });

  it('edit mode prefills and submits update', async () => {
    renderWithProviders(<App />, { initialEntries: ['/evaluations/abc/edit'] });
    expect(await screen.findByText('Edit evaluation')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/title/i)).toHaveValue('Eval'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText('list')).toBeInTheDocument());
  });
});
```

- [ ] **Step 5: Run and verify**

```bash
npx vitest run src/evaluations/__tests__/EvaluationsListPage.test.tsx \
                src/evaluations/__tests__/EvaluationFormPage.test.tsx
```

Expected: 6 passed.

- [ ] **Step 6: Commit**

```bash
git add src/evaluations/EvaluationsListPage.tsx src/evaluations/EvaluationFormPage.tsx \
        src/evaluations/__tests__/EvaluationsListPage.test.tsx \
        src/evaluations/__tests__/EvaluationFormPage.test.tsx
git commit -m "feat(frontend): add list and form pages for evaluations"
```

---

## Phase 5: App Shell

### Task 5.1: NotFoundPage + App.tsx + main.tsx

**Files:**
- Create: `frontend/src/NotFoundPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create `NotFoundPage.tsx`**

```typescript
// src/NotFoundPage.tsx
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold text-slate-300">404</h1>
      <p className="mt-2 text-slate-600">Page not found.</p>
      <Link to="/" className="mt-4 btn-primary">Go home</Link>
    </div>
  );
}
```

- [ ] **Step 2: Replace `App.tsx`**

```typescript
// src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { SignupPage } from './auth/SignupPage';
import { EvaluationsListPage } from './evaluations/EvaluationsListPage';
import { EvaluationFormPage } from './evaluations/EvaluationFormPage';
import { NotFoundPage } from './NotFoundPage';
import { ToastProvider } from './components/ToastProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Navigate to="/evaluations" replace />} />
                  <Route path="/evaluations" element={<EvaluationsListPage />} />
                  <Route path="/evaluations/new" element={<EvaluationFormPage mode="create" />} />
                  <Route path="/evaluations/:id/edit" element={<EvaluationFormPage mode="edit" />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 3: Install devtools**

```bash
npm install -D @tanstack/react-query-devtools
```

- [ ] **Step 4: Replace `main.tsx`**

```typescript
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Verify app boots**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected: redirected to `/login` (since the dev proxy will fail `/me` against the local backend; this is fine — verify the login page renders).

Stop the dev server with Ctrl+C.

- [ ] **Step 6: Verify production build**

```bash
npm run build
```

Expected: build completes; `dist/index.html` and chunks emitted.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/NotFoundPage.tsx src/main.tsx package.json package-lock.json
git commit -m "feat(frontend): wire app shell with router, providers, and devtools"
```

---

### Task 5.2: NotFoundPage test

**Files:**
- Create: `frontend/src/__tests__/NotFoundPage.test.tsx`

- [ ] **Step 1: Write the test**

```typescript
// src/__tests__/NotFoundPage.test.tsx
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { NotFoundPage } from '../NotFoundPage';

describe('NotFoundPage', () => {
  it('renders 404 and a home link', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go home/i })).toHaveAttribute('href', '/');
  });
});
```

- [ ] **Step 2: Run and commit**

```bash
npx vitest run src/__tests__/NotFoundPage.test.tsx
git add src/__tests__/NotFoundPage.test.tsx
git commit -m "test(frontend): cover NotFoundPage"
```

Expected: 1 passed.

---

## Phase 6: Full Coverage Audit

### Task 6.1: Run coverage and fill gaps

- [ ] **Step 1: Run full test suite with coverage**

```bash
npm test -- --coverage
```

- [ ] **Step 2: Open the HTML report**

```bash
# macOS / Windows / Linux — open coverage/index.html in browser
start coverage/index.html  # Windows
```

- [ ] **Step 3: Identify gaps**

In the report, sort by uncovered lines. For each file < 90%:
- Identify which branches are not exercised
- Add a focused test in the appropriate `__tests__/` folder

Common gaps:
- Error branches in mutations (test 500 response)
- Optional fields in components (test both presence and absence)
- Conditional renders (test both conditions)

- [ ] **Step 4: Iterate**

After each batch of new tests:

```bash
npm test -- --coverage
git add src/path/to/__tests__/
git commit -m "test(frontend): cover <module> error branches"
```

- [ ] **Step 5: Final verification**

```bash
npm test -- --coverage
```

Expected: all four metrics (statements, branches, functions, lines) ≥ 90%.

---

## Phase 7: CloudFront Stack (separate SAM template)

### Task 7.1: Author the CloudFront template

**Files:**
- Create: `infra/cloudfront-template.yaml` (at repo root, not under frontend/)
- Create: `infra/deploy-cloudfront.sh`

- [ ] **Step 1: Create the infra folder**

```bash
cd /c/Users/User/Desktop/avacomProjecto
mkdir -p infra
```

- [ ] **Step 2: Create `infra/cloudfront-template.yaml`**

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: AVACOM CloudFront + S3 (frontend) + /api proxy to API Gateway

Parameters:
  ApiDomain:
    Type: String
    Description: The HttpApi domain only (no protocol, no path), e.g. abc123.execute-api.us-east-1.amazonaws.com
  ApiStage:
    Type: String
    Default: prod
    Description: API Gateway stage name, used in origin path
  Stage:
    Type: String
    Default: prod

Resources:
  WebBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub avacom-web-${AWS::AccountId}-${Stage}
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules: [{ ObjectOwnership: BucketOwnerEnforced }]
      VersioningConfiguration:
        Status: Enabled

  OriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub avacom-oac-${Stage}
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  SecurityHeadersPolicy:
    Type: AWS::CloudFront::ResponseHeadersPolicy
    Properties:
      ResponseHeadersPolicyConfig:
        Name: !Sub avacom-security-headers-${Stage}
        SecurityHeadersConfig:
          ContentTypeOptions: { Override: true }
          FrameOptions: { FrameOption: DENY, Override: true }
          ReferrerPolicy: { ReferrerPolicy: strict-origin-when-cross-origin, Override: true }
          StrictTransportSecurity:
            AccessControlMaxAgeSec: 31536000
            IncludeSubdomains: true
            Preload: true
            Override: true
          XSSProtection: { ModeBlock: true, Protection: true, Override: true }

  Distribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        DefaultRootObject: index.html
        HttpVersion: http2and3
        PriceClass: PriceClass_100
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt WebBucket.RegionalDomainName
            S3OriginConfig: { OriginAccessIdentity: '' }
            OriginAccessControlId: !GetAtt OriginAccessControl.Id
          - Id: ApiOrigin
            DomainName: !Ref ApiDomain
            CustomOriginConfig:
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
              OriginSSLProtocols: [TLSv1.2]
            OriginPath: !Sub /${ApiStage}
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods: [GET, HEAD, OPTIONS]
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # Managed-CachingOptimized
          ResponseHeadersPolicyId: !Ref SecurityHeadersPolicy
          Compress: true
        CacheBehaviors:
          - PathPattern: /api/*
            TargetOriginId: ApiOrigin
            ViewerProtocolPolicy: redirect-to-https
            AllowedMethods: [GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE]
            CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # Managed-CachingDisabled
            OriginRequestPolicyId: 216adef6-5c7f-47e4-b989-5492eafa07d3  # Managed-AllViewer (forwards cookies, headers)
            ResponseHeadersPolicyId: !Ref SecurityHeadersPolicy
            Compress: true
        CustomErrorResponses:
          # SPA fallback — let React Router handle 404s
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html

  WebBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudFrontServicePrincipalReadOnly
            Effect: Allow
            Principal: { Service: cloudfront.amazonaws.com }
            Action: s3:GetObject
            Resource: !Sub ${WebBucket.Arn}/*
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub arn:aws:cloudfront::${AWS::AccountId}:distribution/${Distribution}

Outputs:
  DistributionId:
    Value: !Ref Distribution
  DistributionDomain:
    Value: !GetAtt Distribution.DomainName
  WebBucketName:
    Value: !Ref WebBucket
```

- [ ] **Step 3: Create `infra/deploy-cloudfront.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
STACK_NAME="${STACK_NAME:-avacom-cloudfront}"
STAGE="${STAGE:-prod}"
REGION="${REGION:-us-east-1}"
API_STACK="${API_STACK:-avacom}"

# Extract API Gateway domain from the backend stack outputs
API_URL=$(aws cloudformation describe-stacks --stack-name "$API_STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
API_DOMAIN=$(echo "$API_URL" | sed -e 's|https://||' -e 's|/$||')

echo "Deploying CloudFront pointing /api/* to $API_DOMAIN"

sam deploy -t infra/cloudfront-template.yaml \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --parameter-overrides ApiDomain="$API_DOMAIN" ApiStage="$STAGE" Stage="$STAGE"

echo ""
aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs" --output table
```

- [ ] **Step 4: Make script executable + deploy**

```bash
chmod +x infra/deploy-cloudfront.sh
./infra/deploy-cloudfront.sh
```

Expected: CloudFront stack creates (~5-10 minutes for first distribution). Outputs `DistributionId`, `DistributionDomain`, `WebBucketName`.

- [ ] **Step 5: Capture values**

```bash
export DIST_ID=$(aws cloudformation describe-stacks --stack-name avacom-cloudfront \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)
export DIST_DOMAIN=$(aws cloudformation describe-stacks --stack-name avacom-cloudfront \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomain'].OutputValue" --output text)
export WEB_BUCKET=$(aws cloudformation describe-stacks --stack-name avacom-cloudfront \
  --query "Stacks[0].Outputs[?OutputKey=='WebBucketName'].OutputValue" --output text)
echo "Distribution: https://$DIST_DOMAIN"
echo "Bucket: $WEB_BUCKET"
```

- [ ] **Step 6: Commit**

```bash
git add infra/
git commit -m "feat(infra): add CloudFront stack with S3 + API proxy"
```

---

### Task 7.2: Deploy frontend to S3 + invalidate CloudFront

**Files:**
- Create: `infra/deploy-frontend.sh`

- [ ] **Step 1: Create `infra/deploy-frontend.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
STACK_NAME="${STACK_NAME:-avacom-cloudfront}"
REGION="${REGION:-us-east-1}"

WEB_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WebBucketName'].OutputValue" --output text)
DIST_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)

echo "Building frontend..."
cd frontend
npm ci
npm run build

echo "Uploading hashed assets with long cache..."
aws s3 sync dist/ "s3://$WEB_BUCKET" \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000, immutable" \
  --delete

echo "Uploading HTML with no-cache..."
aws s3 sync dist/ "s3://$WEB_BUCKET" \
  --exclude "*" --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --delete

echo "Invalidating CloudFront..."
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*"

DIST_DOMAIN=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomain'].OutputValue" --output text)
echo ""
echo "Deployed. Visit: https://$DIST_DOMAIN"
```

- [ ] **Step 2: Run the deploy**

```bash
chmod +x infra/deploy-frontend.sh
./infra/deploy-frontend.sh
```

Expected: Build → S3 sync → invalidation → URL printed.

- [ ] **Step 3: Smoke test**

```bash
DIST=$(aws cloudformation describe-stacks --stack-name avacom-cloudfront \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomain'].OutputValue" --output text)

# Health (proxied)
curl -s "https://$DIST/api/health" | jq

# Open in browser
echo "https://$DIST"
```

Expected: Health returns 200 JSON. Opening the URL in a browser shows the login page; signup → list → create flow works end-to-end.

- [ ] **Step 4: Commit**

```bash
git add infra/deploy-frontend.sh
git commit -m "feat(infra): add frontend deploy script (build + sync + invalidate)"
```

---

## Phase 8: CI Workflow

### Task 8.1: GitHub Actions test workflow

**Files:**
- Create: `.github/workflows/test.yml`

- [ ] **Step 1: Create `.github/workflows/test.yml`** (at repo root)

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      dynamodb:
        image: amazon/dynamodb-local:2.5.2
        ports: ['8000:8000']
        options: >-
          --health-cmd "curl -s http://localhost:8000 | grep -q 'DynamoDB Local'"
          --health-interval 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: backend/package-lock.json }
      - name: Install
        working-directory: backend
        run: npm ci
      - name: Typecheck + lint
        working-directory: backend
        run: |
          npm run typecheck
          npm run lint
      - name: Unit + integration tests with coverage
        working-directory: backend
        run: npm run test:coverage
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/coverage/

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: frontend/package-lock.json }
      - name: Install
        working-directory: frontend
        run: npm ci
      - name: Tests with coverage
        working-directory: frontend
        run: npm test -- --coverage
      - name: Build
        working-directory: frontend
        run: npm run build
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: frontend/coverage/
```

- [ ] **Step 2: Commit and push**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add GitHub Actions workflow for backend and frontend tests"
```

After pushing to a GitHub repo, verify the workflow runs on the Actions tab and that both jobs go green.

---

## Phase 9: README and Polish

### Task 9.1: Top-level README

**Files:**
- Create: `README.md` (repo root)

- [ ] **Step 1: Create `README.md` at repo root**

```markdown
# AVACOM Evaluation Management System

Full-stack serverless CRUD app for managing course evaluations.

## Architecture

- **Backend:** AWS Lambda (Node 20 + TypeScript + Hono) with hexagonal architecture, two DynamoDB tables, JWT auth via httpOnly cookies. Deployed via AWS SAM.
- **Frontend:** React 18 + Vite + Tailwind, deployed to S3 behind a single CloudFront distribution that also proxies `/api/*` to API Gateway.
- **Testing:** ≥90% statement coverage on both sides (Vitest + DynamoDB Local + MSW).

See [`docs/diagrams/`](./docs/diagrams/) for visual architecture diagrams and [`docs/superpowers/specs/`](./docs/superpowers/specs/) for the full spec.

## Live URL

`https://<your-cloudfront-distribution>.cloudfront.net`

## Quick start (local dev)

```bash
# Backend (terminal 1)
cd backend
npm install
npm run ddb:up
npm run dev   # SAM Local on port 3000

# Frontend (terminal 2)
cd frontend
npm install
npm run dev   # Vite on port 5173 (proxies /api → :3000)
```

## Deploy

```bash
# 1. Backend
cd backend
npm install
npm run deploy:guided   # first time only
npm run deploy

# 2. CloudFront + S3 (one-time)
cd ..
./infra/deploy-cloudfront.sh

# 3. Frontend
./infra/deploy-frontend.sh
```

## Repository layout

```
avacomProjecto/
├── backend/             AWS Lambda + DynamoDB API (hexagonal)
├── frontend/            React + Vite + Tailwind SPA
├── infra/               CloudFront stack and deploy scripts
├── docs/
│   ├── diagrams/        Mermaid architecture diagrams
│   └── superpowers/
│       ├── specs/       Feature spec
│       └── plans/       Implementation plans
└── .github/workflows/   CI
```

## Key decisions

See [§2 Decisions & Tradeoffs](./docs/superpowers/specs/2026-05-17-avacom-fullstack-design.md#2-decisions--tradeoffs) of the spec — every choice has a defensible rationale and a written Q&A defense.

## Tests

```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm test -- --coverage
```

CI runs both on every push and fails if either drops below 90% coverage.

## License

Private. Internal use only.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add top-level README with architecture and deploy instructions"
```

---

### Task 9.2: `.env.example` and final polish

**Files:**
- Create: `backend/.env.example`
- Create: `frontend/.env.example`

- [ ] **Step 1: Create `backend/.env.example`**

```env
# Only needed for local dev with SAM Local
EVALUATIONS_TABLE=avacom-evaluations-local
USERS_TABLE=avacom-users-local
JWT_SECRET=local-secret-must-be-at-least-32-chars-xx
DDB_ENDPOINT=http://localhost:8000
APP_VERSION=local
```

- [ ] **Step 2: Create `frontend/.env.example`**

```env
# Vite reads .env.{development,production} automatically.
# This file shows the keys for reference; copy to .env.local for overrides.
VITE_API_URL=/api
```

- [ ] **Step 3: Commit**

```bash
git add backend/.env.example frontend/.env.example
git commit -m "docs: add .env.example files for backend and frontend"
```

---

## Self-Review Checklist (run before declaring done)

- [ ] Backend deployed and `https://<cloudfront>/api/health` returns 200
- [ ] Frontend deployed and login → signup → create → list flow works end-to-end in production
- [ ] `npm test -- --coverage` in `frontend/` passes ≥ 90% on all metrics
- [ ] No console errors in the browser during normal flows
- [ ] Refresh token interceptor verified: stay on the app for 16 minutes, perform an action — request should silently refresh and succeed
- [ ] Logout clears cookies; refreshing the page after logout lands on `/login`
- [ ] Filters (status + courseId) correctly filter the list
- [ ] Delete confirmation dialog appears and removes the item (soft delete on backend)
- [ ] CI green on a clean checkout
- [ ] README has accurate live URL and deploy commands
- [ ] No `TODO`, `TBD`, or `FIXME` markers in committed code
- [ ] Conventional commit messages throughout

## Demo walkthrough (rehearse for live session)

1. Show CloudFront URL → land on login page
2. Sign up new user → land on empty evaluations page
3. Create evaluation → table updates immediately (TanStack invalidation)
4. Edit it → form pre-filled, save, return to list with updated title
5. Filter by status → list refetches
6. Delete with confirm dialog → row disappears (soft delete in DDB)
7. Open browser DevTools → show Set-Cookie httpOnly + SameSite=Strict
8. Open CloudWatch Logs → show structured JSON with correlationId
9. Open VS Code → walk through hexagonal layout (domain → adapters → http)
10. Point at `docs/diagrams/` for visual architecture context

## Done

Both plans (backend + frontend) complete. The system is production-deployed and CI-gated. For the live session, the demo flow above plus the §2 Decisions & Tradeoffs section of the spec is what you walk the reviewer through.
