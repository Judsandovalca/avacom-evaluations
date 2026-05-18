// src/http/__tests__/cookies.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildSetAccessCookie,
  buildSetRefreshCookie,
  buildClearCookies,
  parseCookies,
} from '../cookies';

describe('cookies', () => {
  describe('buildSetAccessCookie', () => {
    it('builds an access cookie with HttpOnly, Secure, SameSite=Strict, Path=/, Max-Age=900', () => {
      const cookie = buildSetAccessCookie('token-value');
      expect(cookie).toContain('access_token=token-value');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain('Max-Age=900');
    });
  });

  describe('buildSetRefreshCookie', () => {
    it('builds a refresh cookie with Path=/api/auth and Max-Age=604800', () => {
      const cookie = buildSetRefreshCookie('refresh-value');
      expect(cookie).toContain('refresh_token=refresh-value');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain('Path=/api/auth');
      expect(cookie).toContain('Max-Age=604800');
    });
  });

  describe('buildClearCookies', () => {
    it('returns two directives that clear both tokens', () => {
      const cookies = buildClearCookies();
      expect(cookies).toHaveLength(2);
      expect(cookies[0]).toContain('access_token=');
      expect(cookies[0]).toContain('Max-Age=0');
      expect(cookies[0]).toContain('Path=/');
      expect(cookies[1]).toContain('refresh_token=');
      expect(cookies[1]).toContain('Max-Age=0');
      expect(cookies[1]).toContain('Path=/api/auth');
    });
  });

  describe('parseCookies', () => {
    it('parses a standard cookie header', () => {
      const parsed = parseCookies('access_token=abc; refresh_token=def');
      expect(parsed.access_token).toBe('abc');
      expect(parsed.refresh_token).toBe('def');
    });

    it('returns an empty object for undefined or empty input', () => {
      expect(parseCookies(undefined)).toEqual({});
      expect(parseCookies('')).toEqual({});
    });

    it('handles quoted values', () => {
      const parsed = parseCookies('access_token="abc"; refresh_token="def"');
      expect(parsed.access_token).toBe('abc');
      expect(parsed.refresh_token).toBe('def');
    });
  });
});
