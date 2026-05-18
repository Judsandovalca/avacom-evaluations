# Frontend Component Tree

React app structure showing component hierarchy, contexts, and data flow.

```mermaid
graph TB
    Main[main.tsx]
    App[App.tsx]
    QP[QueryClientProvider]
    AP[AuthProvider]
    BR[BrowserRouter]
    EB[ErrorBoundary]

    Routes{Routes}
    Login[LoginPage]
    Signup[SignupPage]
    Protected[ProtectedRoute]
    NotFound[NotFoundPage]

    List[EvaluationsListPage]
    FormCreate[EvaluationFormPage<br/>mode=create]
    FormEdit[EvaluationFormPage<br/>mode=edit]

    subgraph ListChildren[List page]
        FiltersBar[FiltersBar]
        Table[EvaluationsTable]
        DeleteDlg[DeleteConfirmDialog]
        Pagination[PaginationButton]
    end

    subgraph FormChildren[Form page]
        EvalForm[EvaluationForm]
    end

    subgraph Atoms[Atomic components]
        Button[Button]
        Input[Input]
        Select[Select]
        Modal[Modal]
        Toast[Toast]
        Spinner[LoadingSpinner]
    end

    subgraph Hooks[Custom hooks]
        useAuth[useAuth]
        useEvals[useEvaluations]
        useEval[useEvaluation]
        useCreate[useCreateEvaluation]
        useUpdate[useUpdateEvaluation]
        useDelete[useDeleteEvaluation]
    end

    Main --> App
    App --> EB
    EB --> QP
    QP --> AP
    AP --> BR
    BR --> Routes

    Routes --> Login
    Routes --> Signup
    Routes --> Protected
    Routes --> NotFound

    Protected --> List
    Protected --> FormCreate
    Protected --> FormEdit

    List --> FiltersBar
    List --> Table
    List --> DeleteDlg
    List --> Pagination
    FormCreate --> EvalForm
    FormEdit --> EvalForm

    List -.uses.-> useEvals
    List -.uses.-> useDelete
    FormCreate -.uses.-> useCreate
    FormEdit -.uses.-> useEval
    FormEdit -.uses.-> useUpdate
    Login -.uses.-> useAuth
    Signup -.uses.-> useAuth

    classDef provider fill:#FFD700,stroke:#000,color:#000
    classDef page fill:#87CEEB,stroke:#000,color:#000
    classDef component fill:#98FB98,stroke:#000,color:#000
    classDef hook fill:#FFA07A,stroke:#000,color:#000

    class QP,AP,BR,EB provider
    class Login,Signup,List,FormCreate,FormEdit,NotFound page
    class FiltersBar,Table,DeleteDlg,EvalForm,Pagination component
    class useAuth,useEvals,useEval,useCreate,useUpdate,useDelete hook
```

## Provider chain (top to bottom)

```
<ErrorBoundary>           ← catches React render errors, shows fallback UI
  <QueryClientProvider>   ← TanStack Query cache, dev tools
    <AuthProvider>        ← Context: { user, isLoading, login, logout, signup }
      <BrowserRouter>     ← React Router v6
        <Routes>
          ... pages
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
</ErrorBoundary>
```

## Routing rules

| Path | Component | Guard |
|---|---|---|
| `/login` | `LoginPage` | redirects to `/evaluations` if already authed |
| `/signup` | `SignupPage` | redirects to `/evaluations` if already authed |
| `/` | redirect to `/evaluations` | – |
| `/evaluations` | `EvaluationsListPage` | wrapped in `<ProtectedRoute>` |
| `/evaluations/new` | `EvaluationFormPage` (create) | wrapped in `<ProtectedRoute>` |
| `/evaluations/:id/edit` | `EvaluationFormPage` (edit) | wrapped in `<ProtectedRoute>` |
| `*` | `NotFoundPage` | – |

## Data flow patterns

### Reading
```
Page component → useEvaluations() hook → TanStack Query
  ↓ (if not cached)
QueryFn → api.get('/evaluations') → backend
  ↓
Response cached + returned
  ↓
Component re-renders with data, loading, error states
```

### Writing
```
Form submit → useCreateEvaluation() mutation
  ↓
mutation.mutate(formData)
  ↓
api.post('/evaluations', data) → backend
  ↓ on success
queryClient.invalidateQueries(['evaluations']) → list refetches
  ↓
toast.success("Created!") + navigate('/evaluations')
```

### Auto-refresh on 401
```
Any request → 401 response
  ↓
Axios response interceptor catches it
  ↓
Single-flight: POST /auth/refresh (shared promise across concurrent 401s)
  ↓ on success
Retry the original request with new cookie
  ↓ on failure
authContext.logout() + redirect to /login
```

## Why this structure

- **Pages are thin** — they compose hooks and components but contain no business logic
- **Hooks own data fetching** — every API interaction goes through a custom hook; components never call axios directly
- **Atomic components** — shared `Button`, `Input`, `Select`, `Modal` enforce consistent UI
- **Single form for create/edit** — `EvaluationForm` takes a `mode` prop and an optional `initialValues`; cuts maintenance in half
- **Protected route HOC** — auth check lives in one place; if `useAuth().user` is null, redirect to `/login`
