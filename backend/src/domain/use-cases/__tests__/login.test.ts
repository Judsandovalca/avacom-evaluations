import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login } from '../login';
import { UnauthorizedError } from '../../errors';
import type { UserRepository } from '../../user/UserRepository';
import type { TokenService } from '../../auth/TokenService';

const validUser = {
  userId: 'u-1', email: 'a@b.com', passwordHash: 'hashed$xxx',
  name: 'A', createdAt: '2026-05-17T10:00:00.000Z',
};

function deps() {
  return {
    userRepo: { save: vi.fn(), findByEmail: vi.fn().mockResolvedValue(validUser) } as UserRepository,
    tokens: {
      signPair: vi.fn().mockResolvedValue({ accessToken: 'AT', refreshToken: 'RT' }),
      signAccess: vi.fn(), verifyAccess: vi.fn(), verifyRefresh: vi.fn(),
    } as TokenService,
    verifier: { compare: vi.fn().mockResolvedValue(true) },
  };
}

describe('login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns tokens + public user on valid credentials', async () => {
    const d = deps();
    const result = await login(d)({ email: 'a@b.com', password: 'password123' });
    expect(d.verifier.compare).toHaveBeenCalledWith('password123', 'hashed$xxx');
    expect(result.tokens).toEqual({ accessToken: 'AT', refreshToken: 'RT' });
    expect(result.user).toEqual({ userId: 'u-1', email: 'a@b.com', name: 'A' });
  });

  it('throws UnauthorizedError when user not found (no enumeration)', async () => {
    const d = deps();
    vi.mocked(d.userRepo.findByEmail).mockResolvedValue(null);
    await expect(login(d)({ email: 'x@y.com', password: 'password123' }))
      .rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when password mismatches', async () => {
    const d = deps();
    vi.mocked(d.verifier.compare).mockResolvedValue(false);
    await expect(login(d)({ email: 'a@b.com', password: 'wrong' }))
      .rejects.toThrow(UnauthorizedError);
  });

  it('uses the same error message for "not found" and "bad password"', async () => {
    const d = deps();
    vi.mocked(d.userRepo.findByEmail).mockResolvedValue(null);
    const e1 = await login(d)({ email: 'x@y.com', password: 'password123' }).catch(e => e);
    vi.mocked(d.userRepo.findByEmail).mockResolvedValue(validUser);
    vi.mocked(d.verifier.compare).mockResolvedValue(false);
    const e2 = await login(d)({ email: 'a@b.com', password: 'wrong' }).catch(e => e);
    expect(e1.message).toBe(e2.message);
  });
});
