// src/lib/api.ts
import axios from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

interface RetriableRequest extends AxiosRequestConfig { _retried?: boolean; }

let refreshPromise: Promise<void> | null = null;

async function performRefresh(): Promise<void> {
  refreshPromise ??= axios.post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
    .then(() => undefined)
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;
    if (!original || error.response?.status !== 401 || original._retried) {
      throw error;
    }
    const isAuthPath = (original.url ?? '').includes('/auth/');
    if (isAuthPath) throw error;
    original._retried = true;
    try { await performRefresh(); } catch { throw error; }
    return api(original);
  },
);
