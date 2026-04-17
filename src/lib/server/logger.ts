// Structured logging for server-side API handlers.
// Every request gets a correlation_id (client-provided via x-correlation-id
// or x-request-id, else generated) threaded through a child logger so all
// logs emitted during a request share the same trace thread. Foundation for
// Sentry (I2.3), Fabric event correlation, and cross-stack incident triage.

import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  base: {
    service: 'mcv-one-desktop',
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8),
  },
  redact: {
    paths: [
      '*.authorization',
      '*.cookie',
      '*.token',
      '*.api_key',
      '*.apiKey',
      '*.password',
      '*.secret',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function requestLogger(req: { headers?: Record<string, unknown>; url?: string; method?: string }) {
  const correlationId =
    (req.headers?.['x-correlation-id'] as string | undefined) ??
    (req.headers?.['x-request-id'] as string | undefined) ??
    crypto.randomUUID();

  return {
    correlationId,
    log: logger.child({ correlation_id: correlationId, path: req.url, method: req.method }),
  };
}

export type MCVLogger = typeof logger;
