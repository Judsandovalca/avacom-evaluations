# Public courses + UI cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/` a public read-only courses list (instead of forcing login), drop course-IDs from the UI in favor of row numbers, and replace the evaluations courseId text-filter with a dropdown. Make `GET /api/courses` public; `POST /api/courses` stays authed.

**Architecture:** Pure frontend refactor plus one line of backend middleware change. No data model, no API shape changes, no new endpoints. The public landing page self-redirects logged-in users to `/evaluations`, so routing stays flat. The "New evaluation" CTA leverages the existing `ProtectedRoute` + `LoginPage state.from` round-trip — no auth code changes.

**Tech Stack:** Hono (backend middleware), React 19 + react-router-dom v7 + TanStack Query (frontend), Vitest + MSW + Testing Library (tests).

**Spec:** [`docs/superpowers/specs/2026-05-18-public-courses-and-ui-cleanup-design.md`](../specs/2026-05-18-public-courses-and-ui-cleanup-design.md)

**Working dir convention:** All `npm` commands assume `cd` into `backend/` or `frontend/` first.

---

## Task ordering rationale

T1–T4 are independent of each other and can be done in any order. T5 (App.tsx routing) **must** come after T4 (PublicCoursesPage exists). T6 is a verification gate before deploy.

---

## Task 1: Backend — make GET /api/courses public

**Files:**
- Modify: `backend/src/http/app.ts` (the `app.use('/api/courses/*', ...)` line)
- Test: `backend/src/http/__tests__/app.integration.test.ts` (add two cases)

**Prereq:** DynamoDB Local must be running. From `backend/`: `npm run ddb:up` if not already up.

- [ ] **Step 1: Write the failing test — GET /api/courses without cookie returns 200**

In `backend/src/http/__tests__/app.integration.test.ts`, add at the end of the `describe('app (integration)', ...)` block:

```ts
  it('GET /api/courses is public (no auth cookie required)', async () => {
    const app = buildTestApp();
    const r = await app.request('/api/courses');
    expect(r.status).toBe(200);
    const body = await r.json() as { items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('POST /api/courses still requires auth', async () => {
    const app = buildTestApp();
    const r = await app.request('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthorized Course' }),
    });
    expect(r.status).toBe(401);
  });
```

- [ ] **Step 2: Run tests, confirm GET test fails, POST test passes**

```bash
cd backend
npm run test:integration -- -t 'GET /api/courses is public'
```

Expected: **FAIL** with `expected 401 to be 200` (GET is currently behind auth).

```bash
npm run test:integration -- -t 'POST /api/courses still requires auth'
```

Expected: **PASS** (POST is already behind auth — guards against regression).

- [ ] **Step 3: Change the middleware binding in `backend/src/http/app.ts`**

Find this line (around line 40):

```ts
  app.use('/api/courses/*', authMiddleware(deps.tokens));
```

Replace with:

```ts
  app.on(['POST'], '/api/courses/*', authMiddleware(deps.tokens));
```

`app.on(methods, path, mw)` applies the middleware only when the request method matches one of the listed methods. `GET` is not listed so `listCourses` runs without auth. `listCourses` takes no user context, so no code inside the use-case needs to change.

- [ ] **Step 4: Run both new tests; confirm they pass**

```bash
npm run test:integration -- -t '/api/courses'
```

Expected: **PASS** for both `GET /api/courses is public` and `POST /api/courses still requires auth`.

- [ ] **Step 5: Run the full integration suite to catch regressions**

```bash
npm run test:integration
```

Expected: **all pass**. Pay particular attention to existing tests that hit `/api/evaluations` — they should be unaffected.

- [ ] **Step 6: Run unit tests + coverage gate**

```bash
npm run test:coverage
```

Expected: **all pass**, coverage ≥ 90% on each metric.

- [ ] **Step 7: Commit**

```bash
git add backend/src/http/app.ts backend/src/http/__tests__/app.integration.test.ts
git commit -m "feat(courses): make GET /api/courses public, keep POST authed"
```

---

## Task 2: Frontend — FiltersBar courseId becomes a Select

**Files:**
- Modify: `frontend/src/evaluations/FiltersBar.tsx`
- Modify: `frontend/src/evaluations/__tests__/FiltersBar.test.tsx`

**Prereq:** Run from `frontend/`.

- [ ] **Step 1: Update the FiltersBar test to expect a Select instead of a text Input**

Replace the entire contents of `frontend/src/evaluations/__tests__/FiltersBar.test.tsx` with:

```tsx
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import { FiltersBar } from '../FiltersBar';

describe('FiltersBar', () => {
  it('emits status changes', async () => {
    const onChange = vi.fn();
    renderWithProviders(<FiltersBar onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'active');
    expect(onChange).toHaveBeenCalledWith({ status: 'active', courseId: undefined });
  });

  it('populates the course dropdown from /api/courses', async () => {
    const onChange = vi.fn();
    renderWithProviders(<FiltersBar onChange={onChange} />);
    // MSW returns Algorithms (c-1) and Data Structures (c-2) by default
    await waitFor(() => expect(screen.getByRole('option', { name: 'Algorithms' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'Data Structures' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All courses' })).toBeInTheDocument();
  });

  it('emits courseId changes when a course is selected', async () => {
    const onChange = vi.fn();
    renderWithProviders(<FiltersBar onChange={onChange} />);
    await waitFor(() => screen.getByRole('option', { name: 'Algorithms' }));
    await userEvent.selectOptions(screen.getByLabelText('Course'), 'c-1');
    expect(onChange).toHaveBeenLastCalledWith({ status: undefined, courseId: 'c-1' });
  });

  it('clears status filter to undefined when "All statuses" is selected', async () => {
    const onChange = vi.fn();
    renderWithProviders(<FiltersBar status="active" courseId="c-1" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Status'), '');
    expect(onChange).toHaveBeenLastCalledWith({ status: undefined, courseId: 'c-1' });
  });

  it('clears courseId to undefined when "All courses" is selected', async () => {
    const onChange = vi.fn();
    renderWithProviders(<FiltersBar status="active" courseId="c-1" onChange={onChange} />);
    await waitFor(() => screen.getByRole('option', { name: 'Algorithms' }));
    await userEvent.selectOptions(screen.getByLabelText('Course'), '');
    expect(onChange).toHaveBeenLastCalledWith({ status: 'active', courseId: undefined });
  });
});
```

Notes for the implementer:
- The old test used a bare `render` from RTL; we switch to `renderWithProviders` because the component now uses `useCourses()` (TanStack Query + axios), which needs the `QueryClientProvider` wrapper.
- The MSW handlers in `frontend/src/__tests__/msw/handlers.ts` already return `{ items: [{courseId: 'c-1', name: 'Algorithms'}, {courseId: 'c-2', name: 'Data Structures'}] }` for `GET /api/courses`, so no MSW changes are needed.

- [ ] **Step 2: Run tests; confirm they fail**

```bash
cd frontend
npx vitest run src/evaluations/__tests__/FiltersBar.test.tsx
```

Expected: **FAIL**. The new tests look for `getByLabelText('Course')` (no "ID"), and for `option` roles with course names — the current component renders an `<input>` for the courseId field, so the option assertions and the renamed label will not match.

- [ ] **Step 3: Update `FiltersBar.tsx`**

Replace the entire contents of `frontend/src/evaluations/FiltersBar.tsx` with:

```tsx
// src/evaluations/FiltersBar.tsx
import { Select } from '../components/Select';
import { useCourses } from '../courses/hooks/useCourses';
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
  const { data: courses, isLoading } = useCourses();
  const courseOptions = [
    { value: '', label: 'All courses' },
    ...(courses ?? []).map((c) => ({ value: c.courseId, label: c.name })),
  ];

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
        <Select
          label="Course"
          id="filter-course"
          options={courseOptions}
          value={courseId ?? ''}
          disabled={isLoading}
          onChange={(e) => onChange({ status, courseId: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests; confirm they pass**

```bash
npx vitest run src/evaluations/__tests__/FiltersBar.test.tsx
```

Expected: **PASS** for all five tests.

- [ ] **Step 5: Run the full frontend suite to catch regressions**

```bash
npm test
```

Expected: **all pass**. The `EvaluationsListPage` test integrates `FiltersBar` indirectly — verify it still passes.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/evaluations/FiltersBar.tsx frontend/src/evaluations/__tests__/FiltersBar.test.tsx
git commit -m "feat(evaluations): replace courseId text filter with course dropdown"
```

---

## Task 3: Frontend — authed CoursesPage shows row numbers, not IDs

**Files:**
- Modify: `frontend/src/courses/CoursesPage.tsx`
- Create: `frontend/src/courses/__tests__/CoursesPage.test.tsx`

**Prereq:** Run from `frontend/`.

- [ ] **Step 1: Create the failing test file**

Create `frontend/src/courses/__tests__/CoursesPage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import { ToastProvider } from '../../components/ToastProvider';
import { server } from '../../__tests__/msw/server';
import { CoursesPage } from '../CoursesPage';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/courses" element={<CoursesPage />} />
      </Routes>
    </ToastProvider>
  );
}

describe('CoursesPage', () => {
  it('renders courses with sequential row numbers, no IDs visible', async () => {
    renderWithProviders(<App />, { initialEntries: ['/courses'] });
    await waitFor(() => expect(screen.getByText('Algorithms')).toBeInTheDocument());
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    // No course-id substring should appear in the rendered DOM
    const html = document.body.innerHTML;
    expect(html).not.toContain('c-1');
    expect(html).not.toContain('c-2');
  });

  it('shows empty state when there are no courses', async () => {
    server.use(http.get('/api/courses', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<App />, { initialEntries: ['/courses'] });
    await waitFor(() => expect(screen.getByText(/no courses yet/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run the test; confirm it fails**

```bash
npx vitest run src/courses/__tests__/CoursesPage.test.tsx
```

Expected: **FAIL** on `#1` not in document (the current component renders `c-1…` truncated id, not `#1`), and `html.toContain('c-1')` for the no-IDs assertion.

- [ ] **Step 3: Update `CoursesPage.tsx`**

Find this block (around lines 66–75 of `frontend/src/courses/CoursesPage.tsx`):

```tsx
      {courses && courses.length > 0 && (
        <ul className="bg-white rounded-lg shadow-sm divide-y divide-slate-100">
          {courses.map((c) => (
            <li key={c.courseId} className="p-4 flex justify-between items-center">
              <span className="font-medium text-slate-900">{c.name}</span>
              <span className="text-xs text-slate-400 font-mono">{c.courseId.slice(0, 8)}…</span>
            </li>
          ))}
        </ul>
      )}
```

Replace with:

```tsx
      {courses && courses.length > 0 && (
        <ul className="bg-white rounded-lg shadow-sm divide-y divide-slate-100">
          {courses.map((c, i) => (
            <li key={c.courseId} className="p-4 flex items-center gap-4">
              <span className="font-mono text-slate-400 w-8 text-right">#{i + 1}</span>
              <span className="font-medium text-slate-900">{c.name}</span>
            </li>
          ))}
        </ul>
      )}
```

- [ ] **Step 4: Run the test; confirm it passes**

```bash
npx vitest run src/courses/__tests__/CoursesPage.test.tsx
```

Expected: **PASS** for both tests.

- [ ] **Step 5: Run the full frontend suite**

```bash
npm test
```

Expected: **all pass**.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/courses/CoursesPage.tsx frontend/src/courses/__tests__/CoursesPage.test.tsx
git commit -m "feat(courses): show row numbers instead of course IDs on authed page"
```

---

## Task 4: Frontend — create PublicCoursesPage

**Files:**
- Create: `frontend/src/courses/PublicCoursesPage.tsx`
- Create: `frontend/src/courses/__tests__/PublicCoursesPage.test.tsx`

**Prereq:** Run from `frontend/`. The MSW handler for `GET /api/auth/me` defaults to a 200 (logged-in user) — the public-page tests will override it to 401 to simulate a logged-out visitor.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/courses/__tests__/PublicCoursesPage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import { AuthProvider } from '../../auth/AuthProvider';
import { server } from '../../__tests__/msw/server';
import { PublicCoursesPage } from '../PublicCoursesPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PublicCoursesPage />} />
        <Route path="/evaluations" element={<div>EVAL_PAGE</div>} />
      </Routes>
    </AuthProvider>
  );
}

describe('PublicCoursesPage', () => {
  it('renders the public list with row numbers when logged out', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })));
    renderWithProviders(<App />, { initialEntries: ['/'] });
    await waitFor(() => expect(screen.getByText('Algorithms')).toBeInTheDocument());
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    // No course IDs leaked
    const html = document.body.innerHTML;
    expect(html).not.toContain('c-1');
    expect(html).not.toContain('c-2');
  });

  it('has a Log in link and a New evaluation link', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })));
    renderWithProviders(<App />, { initialEntries: ['/'] });
    await waitFor(() => screen.getByText('Algorithms'));
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /new evaluation/i })).toHaveAttribute('href', '/evaluations/new');
  });

  it('redirects logged-in users to /evaluations', async () => {
    // Default MSW handler returns 200 from /api/auth/me, so AuthProvider sees a user
    renderWithProviders(<App />, { initialEntries: ['/'] });
    await waitFor(() => expect(screen.getByText('EVAL_PAGE')).toBeInTheDocument());
  });

  it('shows empty state when there are no courses', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })),
      http.get('/api/courses', () => HttpResponse.json({ items: [] })),
    );
    renderWithProviders(<App />, { initialEntries: ['/'] });
    await waitFor(() => expect(screen.getByText(/no courses yet/i)).toBeInTheDocument());
  });

  it('shows an error alert when the courses fetch fails', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })),
      http.get('/api/courses', () => HttpResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })),
    );
    renderWithProviders(<App />, { initialEntries: ['/'] });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run the test; confirm it fails**

```bash
npx vitest run src/courses/__tests__/PublicCoursesPage.test.tsx
```

Expected: **FAIL** with module-not-found on `../PublicCoursesPage`.

- [ ] **Step 3: Create `PublicCoursesPage.tsx`**

Create `frontend/src/courses/PublicCoursesPage.tsx`:

```tsx
import { Link, Navigate } from 'react-router-dom';
import { useCourses } from './hooks/useCourses';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function PublicCoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: courses, isLoading, isError, refetch } = useCourses();

  if (authLoading) return <LoadingSpinner />;
  if (user) return <Navigate to="/evaluations" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">AVACOM Evaluations</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-brand-600 hover:underline text-sm">Log in</Link>
            <Link to="/evaluations/new">
              <Button>New evaluation</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Available courses</h1>

        {isLoading && <LoadingSpinner />}
        {isError && (
          <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-red-700">Could not load courses.</p>
            <Button variant="secondary" onClick={() => refetch()} className="mt-2">Retry</Button>
          </div>
        )}
        {courses && courses.length === 0 && (
          <p className="text-slate-500 italic">No courses yet.</p>
        )}
        {courses && courses.length > 0 && (
          <ul className="bg-white rounded-lg shadow-sm divide-y divide-slate-100">
            {courses.map((c, i) => (
              <li key={c.courseId} className="p-4 flex items-center gap-4">
                <span className="font-mono text-slate-400 w-8 text-right">#{i + 1}</span>
                <span className="font-medium text-slate-900">{c.name}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
```

Notes:
- We use `useAuth()` to decide whether to redirect. While `authLoading` is true we show a spinner — this avoids a flash where a logged-in user briefly sees the public page before being redirected.
- The "New evaluation" link goes directly to `/evaluations/new`. `ProtectedRoute` will catch the unauthenticated state and redirect to `/login` with `state.from` set; `LoginPage` already handles the round-trip back.

- [ ] **Step 4: Run the test; confirm it passes**

```bash
npx vitest run src/courses/__tests__/PublicCoursesPage.test.tsx
```

Expected: **PASS** for all five tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/courses/PublicCoursesPage.tsx frontend/src/courses/__tests__/PublicCoursesPage.test.tsx
git commit -m "feat(courses): add PublicCoursesPage read-only landing component"
```

---

## Task 5: Frontend — wire PublicCoursesPage into routing

**Files:**
- Modify: `frontend/src/App.tsx`

**Prereq:** Task 4 complete (PublicCoursesPage exists).

- [ ] **Step 1: Update App.tsx routing**

Find this block in `frontend/src/App.tsx`:

```tsx
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Navigate to="/evaluations" replace />} />
                  <Route path="/evaluations" element={<EvaluationsListPage />} />
                  <Route path="/evaluations/new" element={<EvaluationFormPage mode="create" />} />
                  <Route path="/evaluations/:id/edit" element={<EvaluationFormPage mode="edit" />} />
                  <Route path="/courses" element={<CoursesPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
```

Replace with:

```tsx
                <Route path="/" element={<PublicCoursesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/evaluations" element={<EvaluationsListPage />} />
                  <Route path="/evaluations/new" element={<EvaluationFormPage mode="create" />} />
                  <Route path="/evaluations/:id/edit" element={<EvaluationFormPage mode="edit" />} />
                  <Route path="/courses" element={<CoursesPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
```

Also remove the unused `Navigate` import from the top of the file (it was only used by the deleted `<Navigate to="/evaluations">` route).

Find:

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
```

Replace with:

```tsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
```

Add the PublicCoursesPage import alongside the existing course imports. Find:

```tsx
import { CoursesPage } from './courses/CoursesPage';
```

Replace with:

```tsx
import { CoursesPage } from './courses/CoursesPage';
import { PublicCoursesPage } from './courses/PublicCoursesPage';
```

- [ ] **Step 2: Run the full frontend suite**

```bash
npm test
```

Expected: **all pass**. The PublicCoursesPage tests already exercise the integration of `useAuth` + `<Navigate>`; the App-level wire-up just changes which component sits at `/`.

- [ ] **Step 3: Typecheck and build**

```bash
npm run build
```

Expected: build succeeds. If TypeScript complains about an unused `Navigate` import that wasn't removed, remove it now.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(routing): public courses page becomes app landing"
```

---

## Task 6: Verification

**Files:** none — read-only gate before deploy.

- [ ] **Step 1: Backend — full coverage gate**

```bash
cd backend
npm run test:coverage
```

Expected: all tests pass, coverage thresholds (90% statements/branches/functions/lines) met.

- [ ] **Step 2: Backend — lint and typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: zero errors.

- [ ] **Step 3: Frontend — full test with coverage**

```bash
cd ../frontend
npm test -- --coverage
```

Expected: all tests pass, 90% threshold met.

- [ ] **Step 4: Frontend — lint and build**

```bash
npm run lint
npm run build
```

Expected: zero errors, successful build.

- [ ] **Step 5: Manual smoke test (dev)**

```bash
# Terminal 1
cd backend && npm run ddb:up && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open `http://localhost:5173` in an **incognito window** (no auth cookie):
- Expect to see the public courses list at `/`, not the login screen.
- Click "New evaluation" → land on `/login` with `?from` in router state. After signing up or logging in, you land on `/evaluations/new`.
- After login, refresh `/` → expect immediate redirect to `/evaluations`.
- On `/evaluations`, the "Course" filter is a dropdown populated from the courses list (not a text input).
- On `/courses`, items show `#1`, `#2`, … and **no** UUID-shaped IDs anywhere.

If any of these fail, fix and re-run from Step 1.

---

## Out of scope

- No deploy step in this plan. After verification passes, deploy via the documented flow (`cd backend && npm run deploy`, then `bash infra/deploy-frontend.sh`).
- No new public endpoints beyond unauthenticating `GET /api/courses`.
- No changes to API response shape, schemas, or DynamoDB tables.
- No changes to login/signup pages or `ProtectedRoute`.
