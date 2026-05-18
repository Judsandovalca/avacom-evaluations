// src/http/routes/health.routes.ts
import { Hono } from 'hono';

const STARTED_AT = Date.now();

export function buildHealthRoutes() {
  const r = new Hono();
  r.get('/', (c) => c.json({
    status: 'ok',
    version: process.env.APP_VERSION ?? 'dev',
    uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
  }));
  return r;
}
