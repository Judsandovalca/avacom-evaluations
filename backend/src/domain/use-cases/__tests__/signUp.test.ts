import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp } from '../signUp';
import { ConflictError, ValidationError } from '../../errors';
import type { UserRepository } from '../../user/UserRepository';
import type { TokenService } from '../../auth/TokenService';

function makeRepo(): UserRepository {
  return { save: vi.fn(), findByEmail: vi.fn() };
}
function makeTokens(): TokenService {
  return {
    signPair: vi.fn().mockResolvedValue({ accessToken: 'AT', refreshToken: 'RT' }),
    signAccess: vi.fn(),
    verifyAccess: vi.fn(),
    verifyRefresh: vi.fn(),
  };
}
const hasher = { hash: vi.fn().mockResolvedValue('hashed$xxx') };

describe('signUp', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hashes password, persists user, and returns tokens + public user', async () => {
    const userRepo = makeRepo();
    (userRepo.findByEmail as any).mockResolvedValue(null);
    const tokens = makeTokens();

    const result = await signUp({ userRepo, tokens, hasher })({
      email: 'NEW@avacom.com', password: 'password123', name: 'New',
    });

    expect(hasher.hash).toHaveBeenCalledWith('password123', 10);
    expect(userRepo.save).toHaveBeenCalledOnce();
    const saved = (userRepo.save as any).mock.calls[0][0];
    expect(saved.email).toBe('new@avacom.com');
    expect(saved.passwordHash).toBe('hashed$xxx');
    expect(result.tokens).toEqual({ accessToken: 'AT', refreshToken: 'RT' });
    expect(result.user).toEqual({ userId: saved.userId, email: 'new@avacom.com', name: 'New' });
  });

  it('rejects when email already exists', async () => {
    const userRepo = makeRepo();
    (userRepo.findByEmail as any).mockResolvedValue({ email: 'x@y.com' });

    await expect(
      signUp({ userRepo, tokens: makeTokens(), hasher })({
        email: 'x@y.com', password: 'password123', name: 'X',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('rejects password shorter than 8 chars', async () => {
    const userRepo = makeRepo();
    (userRepo.findByEmail as any).mockResolvedValue(null);

    await expect(
      signUp({ userRepo, tokens: makeTokens(), hasher })({
        email: 'a@b.com', password: 'short', name: 'A',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('normalizes email before lookup', async () => {
    const userRepo = makeRepo();
    (userRepo.findByEmail as any).mockResolvedValue(null);

    await signUp({ userRepo, tokens: makeTokens(), hasher })({
      email: '  USER@DOMAIN.COM  ', password: 'password123', name: 'X',
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('user@domain.com');
  });

  it('returns userId and email in token payload', async () => {
    const userRepo = makeRepo();
    (userRepo.findByEmail as any).mockResolvedValue(null);
    const tokens = makeTokens();

    await signUp({ userRepo, tokens, hasher })({
      email: 'a@b.com', password: 'password123', name: 'A',
    });

    const call = (tokens.signPair as any).mock.calls[0][0];
    expect(call.email).toBe('a@b.com');
    expect(call.userId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
