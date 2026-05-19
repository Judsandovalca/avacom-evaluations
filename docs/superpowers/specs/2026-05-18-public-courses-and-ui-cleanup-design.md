# Public courses landing + UI cleanup

**Date:** 2026-05-18
**Status:** Draft (pending user review)
**Scope:** Frontend routing/UX changes plus one backend auth tweak. No data model or API shape changes.

## 1. Motivation

Today the very first thing an unauthenticated visitor sees is a login form. This is hostile to first-time visitors who just want to know what the app is about. The list of available courses is the cheapest piece of context we can show without leaking anything sensitive.

Three smaller UX issues are bundled in:

1. The authed courses page exposes raw `courseId` UUIDs (truncated, mono-font). Users don't care about the ID.
2. The evaluations filter bar asks the user to type a `courseId` UUID — practically unusable.
3. The root route forces logged-out users to login before they can do anything, including read.

## 2. Goals

- Logged-out visitors land on a **public, read-only courses list** at `/`.
- Logged-in visitors keep the current behavior: `/` redirects to `/evaluations`.
- An unauthenticated click on **"New evaluation"** routes through login and returns the user to `/evaluations/new`.
- Course IDs disappear from all user-facing UI. The authed courses page shows row numbers (`#1`, `#2`, …) instead.
- The evaluations list filter for "course" becomes a dropdown populated from the courses list, not a free-text UUID input.

## 3. Non-goals

- No persistent course-number entity (the number is purely a display row index).
- No change to the API response shape — `GET /api/courses` still returns full `Course` objects including `courseId`.
- No change to the data model, secondary indexes, or DynamoDB tables.
- No redesign of the authed `/courses` management page beyond removing the ID column.
- No change to the login UI/flow itself (`state.from` round-trip already works).
- No new public endpoints beyond unauthenticating one existing GET.

## 4. Architecture

### 4.1 Routing (`frontend/src/App.tsx`)

The root route moves out from under `<ProtectedRoute>` and becomes a public page.

**Before:**

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<Navigate to="/evaluations" replace />} />
  <Route path="/evaluations" ... />
  <Route path="/evaluations/new" ... />
  <Route path="/evaluations/:id/edit" ... />
  <Route path="/courses" ... />
</Route>
```

**After:**

```tsx
<Route path="/" element={<PublicCoursesPage />} />
<Route path="/login" element={<LoginPage />} />
<Route path="/signup" element={<SignupPage />} />
<Route element={<ProtectedRoute />}>
  <Route path="/evaluations" ... />
  <Route path="/evaluations/new" ... />
  <Route path="/evaluations/:id/edit" ... />
  <Route path="/courses" ... />
</Route>
```

The logged-in-user fast path is preserved inside `PublicCoursesPage` itself:

```tsx
const { user, isLoading } = useAuth();
if (isLoading) return <LoadingSpinner />;
if (user) return <Navigate to="/evaluations" replace />;
```

This keeps the routing tree flat — no nested guards, no separate "if logged in show A else show B" wrapper component.

### 4.2 Public courses page (`frontend/src/courses/PublicCoursesPage.tsx`)

New file. Read-only. Reuses the existing `useCourses()` hook unchanged (it just calls `GET /api/courses`).

**Layout:**

```
┌────────────────────────────────────────────────────┐
│ AVACOM Evaluations              [Log in] [New eval]│   ← minimal header
├────────────────────────────────────────────────────┤
│ Available courses                                   │
│                                                     │
│  #1   Machine Learning                              │
│  #2   Data Structures                               │
│  #3   Operating Systems                             │
│                                                     │
└────────────────────────────────────────────────────┘
```

**Header contents:** app name as plain text, "Log in" link (`/login`), "New evaluation" button (`/evaluations/new`). No branding beyond the app name. No marketing copy.

**Auth round-trip for "New evaluation":** the button is a plain `<Link to="/evaluations/new">`. The protected route guard already attaches `state.from = location` on the redirect to login, and `LoginPage` already does `navigate(from ?? '/evaluations')` on success. So a logged-out click on "New evaluation" → `/login` → after login → `/evaluations/new`. **No changes to `LoginPage` or `ProtectedRoute` required.**

**Body:** the same list rendering as the authed `CoursesPage` but with no create-form and no manage controls. Empty state: "No courses yet." Error state: same as authed page (alert + retry button).

### 4.3 Authed courses page (`frontend/src/courses/CoursesPage.tsx`)

Single visual change. The right-hand truncated ID span is replaced by a left-hand row number.

**Before:**

```tsx
{courses.map((c) => (
  <li key={c.courseId} className="p-4 flex justify-between items-center">
    <span className="font-medium text-slate-900">{c.name}</span>
    <span className="text-xs text-slate-400 font-mono">{c.courseId.slice(0, 8)}…</span>
  </li>
))}
```

**After:**

```tsx
{courses.map((c, i) => (
  <li key={c.courseId} className="p-4 flex items-center gap-4">
    <span className="font-mono text-slate-400 w-8 text-right">#{i + 1}</span>
    <span className="font-medium text-slate-900">{c.name}</span>
  </li>
))}
```

The numbering is display-only — it shifts when courses are added/removed. The persisted entity is unchanged.

### 4.4 Filters bar (`frontend/src/evaluations/FiltersBar.tsx`)

Replace the free-text "Course ID" input with a course `Select`. The wire format on the URL query string (`?courseId=<uuid>`) is unchanged — only the input control changes.

```tsx
const { data: courses, isLoading } = useCourses();
const courseOptions = [
  { value: '', label: 'All courses' },
  ...(courses ?? []).map((c) => ({ value: c.courseId, label: c.name })),
];

<Select
  label="Course"
  id="filter-course"
  options={courseOptions}
  value={courseId ?? ''}
  disabled={isLoading}
  onChange={(e) => onChange({ status, courseId: e.target.value || undefined })}
/>
```

Loading state shows the select disabled with a placeholder. Error state: if `useCourses()` errors, the select stays disabled with the existing options array (empty + "All courses") — the evaluations list is still usable, just unfilterable by course.

### 4.5 Backend auth (`backend/src/http/app.ts`)

`GET /api/courses` becomes public. `POST /api/courses` stays authed.

**Before:**

```ts
app.use('/api/courses/*', authMiddleware(deps.tokens));
app.route('/api/courses', buildCoursesRoutes({ repo: deps.courseRepo }));
```

**After:**

```ts
app.on(['POST'], '/api/courses/*', authMiddleware(deps.tokens));
app.route('/api/courses', buildCoursesRoutes({ repo: deps.courseRepo }));
```

This keeps the auth wiring centralised in `app.ts` next to the other route bindings, and avoids threading `tokens` through `CoursesDeps` to apply per-route auth inside `courses.routes.ts`.

Hono's `app.on(methods, path, mw)` matches the listed methods on that path. `GET` is not listed, so it bypasses `authMiddleware` and the existing route handler runs. The `listCourses` use-case takes no user context, so no code inside it needs to change. If/when PUT/DELETE are added to courses later, this list grows.

## 5. Data flow

```
Logged-out visitor
  /                         GET                       PublicCoursesPage
                            -- useCourses() -->       /api/courses (200, no cookie required)
                            <-- 200 [...]
  click "New evaluation"
  /evaluations/new          ProtectedRoute redirects  /login, state.from=/evaluations/new
  /login (submit)           POST /api/auth/login
                            <-- 200 (sets cookies)
                            navigate(state.from)  →   /evaluations/new ✓

Logged-in visitor
  /                         PublicCoursesPage mounts, useAuth() returns user
                            <Navigate to="/evaluations" replace>
  /evaluations              ProtectedRoute → list page (unchanged)
```

## 6. Error handling

| Surface | Failure | Behavior |
|---|---|---|
| `PublicCoursesPage` — courses fetch fails | Network/server error | Same alert + retry pattern as authed `CoursesPage`. |
| `PublicCoursesPage` — courses empty | `[]` returned | "No courses yet." |
| `FiltersBar` — courses fetch fails | Network/server error | Select disabled; user can still filter by status. No toast — the page is still functional. |
| Auth round-trip | User clicks "New evaluation", logs in, but login fails | Existing `LoginPage` toast: "Invalid email or password". User stays on `/login`. |
| Backend `POST /api/courses` without cookie | Unauthenticated request | 401 (unchanged — auth middleware still applied to POST). |

## 7. Testing

### Frontend

- **`PublicCoursesPage.test.tsx` (new)**
  - Renders course list with `#1`, `#2`, … prefixes.
  - "Log in" link points to `/login`.
  - "New evaluation" link points to `/evaluations/new`.
  - **Assertion: no `courseId` UUID substring appears anywhere in the DOM.**
  - Empty state, error state, retry button (mirror authed page tests).
- **`PublicCoursesPage` auth-aware redirect**
  - When `useAuth()` returns a user, page renders a `<Navigate>` to `/evaluations`. Test with a `MemoryRouter` + `AuthProvider` mock.
- **`CoursesPage.test.tsx` (update)**
  - Replace "shows truncated course ID" assertion with "shows `#1`, `#2` row numbers".
  - Assert no UUID-shaped strings in the rendered list.
- **`FiltersBar.test.tsx` (update)**
  - Replace text-input assertion with select-with-options assertion.
  - Selecting a course option calls `onChange` with that `courseId`.
  - Selecting "All courses" calls `onChange` with `courseId: undefined`.
- **Routing integration**
  - Logged-out user navigating to `/` sees the public list (not login).
  - Logged-out user clicking "New evaluation" lands on `/login` with the right `state.from`, then on `/evaluations/new` after a mocked successful login.

### Backend

- **`courses.routes.integration.test.ts` (update or new)** — using the existing DDB Local rig:
  - `GET /api/courses` without cookie → 200.
  - `POST /api/courses` without cookie → 401.
  - `POST /api/courses` with valid cookie → 201 (regression).

## 8. Coverage impact

Both packages enforce a 90% coverage gate. The new `PublicCoursesPage` is small and fully testable; the existing pages getting modifications already have tests being updated alongside. No expected drop.

## 9. Rollout

Single PR, no feature flag. The behavior change is:

- A previously-required login becomes optional for landing.
- The course-id text filter becomes a dropdown (URL query format unchanged — bookmarks with `?courseId=…` still work).
- The course-id column in the authed courses page becomes a row number.

No data migration. No infra changes. Deploy is the existing flow:

```
cd backend && npm run deploy
bash infra/deploy-frontend.sh
```

## 10. Open questions

None as of 2026-05-18 (user approved defaults: minimal public header, `#N — Course name` only, no other course-ID cleanup).
