import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function GuestRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (user) return <Navigate to="/evaluations" replace />;
  return <Outlet />;
}
