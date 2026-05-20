// src/http/middleware/loggerMiddleware.ts
import type { MiddlewareHandler } from 'hono';
import { Logger } from '@aws-lambda-powertools/logger';
import { randomUUID } from 'node:crypto';

const logger = new Logger({ serviceName: 'avacom-api' });

export function loggerMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const correlationId = c.req.header('x-correlation-id') ?? randomUUID();
    const started = Date.now();
    logger.appendKeys({ correlationId });
    logger.info('request_received', {
      method: c.req.method,
      path: c.req.path,
      key: c.req.param('key'),
      limit: c.req.param('limit'),
    });

    try {
      await next();
    } finally {
      logger.info('request_completed', {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - started,
      });
      logger.removeKeys(['correlationId']);
    }
  };
}
