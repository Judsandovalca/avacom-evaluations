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
