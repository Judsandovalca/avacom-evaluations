// src/http/middleware/authMiddleware.ts
import type { Context, MiddlewareHandler } from 'hono';
import type { TokenService, TokenPayload } from '../../domain/auth/TokenService';
import { parseCookies } from '../cookies';
import { UnauthorizedError } from '../../domain/errors';

export interface AuthVariables {
  userId: string;
  userEmail: string;
}

export function authMiddleware(tokens: TokenService): MiddlewareHandler {
  return async (c: Context, next) => {
    const cookies = parseCookies(c.req.header('Cookie'));
    const token = cookies['access_token'];
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    let payload: TokenPayload;
    try {
      payload = await tokens.verifyAccess(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    await next();
  };
}
