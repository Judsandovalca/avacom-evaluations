import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshToken } from '../refreshToken';
import { UnauthorizedError } from '../../errors';

function deps() {
  return {
    tokens: {
      signPair: vi.fn(),
      signAccess: vi.fn().mockResolvedValue('NEW_AT'),
      verifyAccess: vi.fn(),
      verifyRefresh: vi.fn().mockResolvedValue({ userId: 'u-1', email: 'a@b.com' }),
    },
  };
}

describe('refreshToken', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a new access token when refresh is valid', async () => {
    const d = deps();
    const result = await refreshToken(d)({ refreshToken: 'RT' });
    expect(d.tokens.verifyRefresh).toHaveBeenCalledWith('RT');
    expect(d.tokens.signAccess).toHaveBeenCalledWith({ userId: 'u-1', email: 'a@b.com' });
    expect(result).toEqual({ accessToken: 'NEW_AT' });
  });

  it('throws UnauthorizedError when refresh verification fails', async () => {
    const d = deps();
    (d.tokens.verifyRefresh as any).mockRejectedValue(new Error('expired'));
    await expect(refreshToken(d)({ refreshToken: 'bad' }))
      .rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when refresh token is empty', async () => {
    const d = deps();
    await expect(refreshToken(d)({ refreshToken: '' }))
      .rejects.toThrow(UnauthorizedError);
    expect(d.tokens.verifyRefresh).not.toHaveBeenCalled();
  });
});
