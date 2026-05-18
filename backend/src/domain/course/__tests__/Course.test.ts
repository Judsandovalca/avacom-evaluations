import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Course, DEFAULT_COURSES } from '../Course';

describe('Course', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-17T10:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('create() generates a UUID, trims name, sets createdAt', () => {
    const c = Course.create({ name: '  Algorithms  ' });
    expect(c.courseId).toMatch(/^[0-9a-f-]{36}$/);
    expect(c.name).toBe('Algorithms');
    expect(c.createdAt).toBe('2026-05-17T10:00:00.000Z');
  });

  it('exports 6 default course names', () => {
    expect(DEFAULT_COURSES).toHaveLength(6);
    expect(DEFAULT_COURSES.every((n) => typeof n === 'string' && n.length > 0)).toBe(true);
  });
});
