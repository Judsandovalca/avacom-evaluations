// src/http/cookies.ts

const ACCESS_TOKEN_NAME = 'access_token';
const REFRESH_TOKEN_NAME = 'refresh_token';

const ACCESS_PATH = '/';
const REFRESH_PATH = '/api/auth';

const ACCESS_MAX_AGE = 900; // 15 minutes
const REFRESH_MAX_AGE = 604800; // 7 days

function buildCookie(name: string, value: string, path: string, maxAge: number): string {
  const secure = process.env.COOKIE_SECURE !== 'false';
  const parts = [
    `${name}=${value}`,
    'HttpOnly',
    'SameSite=Lax',
    `Path=${path}`,
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.splice(2, 0, 'Secure');
  return parts.join('; ');
}

export function buildSetAccessCookie(token: string): string {
  return buildCookie(ACCESS_TOKEN_NAME, token, ACCESS_PATH, ACCESS_MAX_AGE);
}

export function buildSetRefreshCookie(token: string): string {
  return buildCookie(REFRESH_TOKEN_NAME, token, REFRESH_PATH, REFRESH_MAX_AGE);
}

export function buildClearCookies(): [string, string] {
  return [
    buildCookie(ACCESS_TOKEN_NAME, '', ACCESS_PATH, 0),
    buildCookie(REFRESH_TOKEN_NAME, '', REFRESH_PATH, 0),
  ];
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;

  const parts = header.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (name) out[name] = value;
  }
  return out;
}
