import { describe, it, expect } from 'vitest';
import { JwtTokenService } from '../JwtTokenService';

const SECRET = 'a-very-long-secret-for-tests-only-32chars+';

describe('JwtTokenService', () => {
  const svc = new JwtTokenService(SECRET, { accessTtl: '15m', refreshTtl: '7d' });

  it('signs and verifies an access token roundtrip', async () => {
    const at = await svc.signAccess({ userId: 'u-1', email: 'a@b.com' });
    const payload = await svc.verifyAccess(at);
    expect(payload).toEqual({ userId: 'u-1', email: 'a@b.com' });
  });

  it('signs and verifies a refresh token roundtrip', async () => {
    const { refreshToken } = await svc.signPair({ userId: 'u-1', email: 'a@b.com' });
    const payload = await svc.verifyRefresh(refreshToken);
    expect(payload.userId).toBe('u-1');
  });

  it('verifyAccess rejects refresh token (wrong typ)', async () => {
    const { refreshToken } = await svc.signPair({ userId: 'u-1', email: 'a@b.com' });
    await expect(svc.verifyAccess(refreshToken)).rejects.toThrow();
  });

  it('rejects token signed with a different secret', async () => {
    const other = new JwtTokenService('different-very-long-secret-32chars+xx', { accessTtl: '15m', refreshTtl: '7d' });
    const at = await other.signAccess({ userId: 'u-1', email: 'a@b.com' });
    await expect(svc.verifyAccess(at)).rejects.toThrow();
  });

  it('rejects malformed token', async () => {
    await expect(svc.verifyAccess('not-a-jwt')).rejects.toThrow();
  });
});
