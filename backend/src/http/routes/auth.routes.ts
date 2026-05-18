// src/http/routes/auth.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { throwOnInvalid } from '../validatorHook';
import type { UserRepository } from '../../domain/user/UserRepository';
import type { TokenService } from '../../domain/auth/TokenService';
import { signUp, type Hasher } from '../../domain/use-cases/signUp';
import { login, type PasswordVerifier } from '../../domain/use-cases/login';
import { refreshToken } from '../../domain/use-cases/refreshToken';
import { getCurrentUser } from '../../domain/use-cases/getCurrentUser';
import { signupSchema, loginSchema } from '../schemas';
import { buildSetAccessCookie, buildSetRefreshCookie, buildClearCookies, parseCookies } from '../cookies';

export interface AuthDeps {
  userRepo: UserRepository;
  tokens: TokenService;
  hasher: Hasher;
  verifier: PasswordVerifier;
}

export function buildAuthRoutes(deps: AuthDeps) {
  const r = new Hono();

  r.post('/signup', zValidator('json', signupSchema, throwOnInvalid), async (c) => {
    const body = c.req.valid('json');
    const result = await signUp(deps)(body);
    c.header('Set-Cookie', buildSetAccessCookie(result.tokens.accessToken), { append: true });
    c.header('Set-Cookie', buildSetRefreshCookie(result.tokens.refreshToken), { append: true });
    return c.json({ user: result.user }, 201);
  });

  r.post('/login', zValidator('json', loginSchema, throwOnInvalid), async (c) => {
    const body = c.req.valid('json');
    const result = await login(deps)(body);
    c.header('Set-Cookie', buildSetAccessCookie(result.tokens.accessToken), { append: true });
    c.header('Set-Cookie', buildSetRefreshCookie(result.tokens.refreshToken), { append: true });
    return c.json({ user: result.user });
  });

  r.post('/refresh', async (c) => {
    const cookies = parseCookies(c.req.header('Cookie'));
    const { accessToken } = await refreshToken(deps)({ refreshToken: cookies['refresh_token'] ?? '' });
    c.header('Set-Cookie', buildSetAccessCookie(accessToken));
    return c.body(null, 204);
  });

  r.post('/logout', async (c) => {
    for (const cookie of buildClearCookies()) c.header('Set-Cookie', cookie, { append: true });
    return c.body(null, 204);
  });

  return r;
}

export function buildMeRoute(deps: { userRepo: UserRepository }) {
  const r = new Hono<{ Variables: { userId: string; userEmail: string } }>();
  r.get('/', async (c) => {
    const user = await getCurrentUser(deps)({ email: c.get('userEmail') });
    return c.json({ user });
  });
  return r;
}
