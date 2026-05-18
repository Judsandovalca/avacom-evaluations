import type { TokenService } from '../auth/TokenService';
import { UnauthorizedError } from '../errors';

export interface RefreshDeps { tokens: TokenService; }
export interface RefreshInput { refreshToken: string; }
export interface RefreshResult { accessToken: string; }

export function refreshToken(deps: RefreshDeps) {
  return async (input: RefreshInput): Promise<RefreshResult> => {
    if (!input.refreshToken) throw new UnauthorizedError('Missing refresh token');
    let payload;
    try {
      payload = await deps.tokens.verifyRefresh(input.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
    const accessToken = await deps.tokens.signAccess({
      userId: payload.userId, email: payload.email,
    });
    return { accessToken };
  };
}
