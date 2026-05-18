import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUser } from '../getCurrentUser';
import { NotFoundError } from '../../errors';

const u = { userId: 'u-1', email: 'a@b.com', passwordHash: 'h', name: 'A', createdAt: '2026' };

describe('getCurrentUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns public user when found', async () => {
    const userRepo = { save: vi.fn(), findByEmail: vi.fn().mockResolvedValue(u) };
    const result = await getCurrentUser({ userRepo })({ email: 'a@b.com' });
    expect(result).toEqual({ userId: 'u-1', email: 'a@b.com', name: 'A' });
  });

  it('throws NotFoundError if user does not exist', async () => {
    const userRepo = { save: vi.fn(), findByEmail: vi.fn().mockResolvedValue(null) };
    await expect(getCurrentUser({ userRepo })({ email: 'x@y.com' }))
      .rejects.toThrow(NotFoundError);
  });
});
