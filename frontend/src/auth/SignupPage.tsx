import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
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
      const { data: resp } = await api.post<{ user: { userId: string; email: string; name: string } }>(
        '/auth/signup',
        data,
      );
      setUser(resp.user);
      navigate('/evaluations', { replace: true });
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      const msg = status === 409 ? 'Email already registered' : 'Could not sign up';
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
