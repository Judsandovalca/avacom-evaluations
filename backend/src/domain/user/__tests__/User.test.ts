import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { User } from '../User';

describe('User', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T10:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('create() normalizes email to lowercase and trims, generates userId and timestamps', () => {
    const u = User.create({
      email: '  Test@AVACOM.com  ',
      passwordHash: 'hash$xxx',
      name: 'Test User',
    });
    expect(u.email).toBe('test@avacom.com');
    expect(u.userId).toMatch(/^[0-9a-f-]{36}$/);
    expect(u.passwordHash).toBe('hash$xxx');
    expect(u.name).toBe('Test User');
    expect(u.createdAt).toBe('2026-05-17T10:00:00.000Z');
  });

  it('toPublic() strips passwordHash', () => {
    const u = User.create({ email: 'a@b.com', passwordHash: 'secret', name: 'A' });
    const pub = User.toPublic(u);
    expect(pub).toEqual({ userId: u.userId, email: 'a@b.com', name: 'A' });
    expect((pub as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
  });
});
