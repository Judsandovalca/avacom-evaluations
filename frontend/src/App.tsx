import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { SignupPage } from './auth/SignupPage';
import { EvaluationsListPage } from './evaluations/EvaluationsListPage';
import { EvaluationFormPage } from './evaluations/EvaluationFormPage';
import { CoursesPage } from './courses/CoursesPage';
import { PublicCoursesPage } from './courses/PublicCoursesPage';
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
              </Routes>
            </AuthProvider>
          </BrowserRouter>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
