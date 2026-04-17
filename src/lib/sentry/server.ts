import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentryServer() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? 'local',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      if (event.request?.cookies) delete event.request.cookies;
      return event;
    },
  });

  initialized = true;
}

export function captureHandlerError(
  err: unknown,
  context: {
    correlation_id?: string;
    handler?: string;
    venture_id?: string;
  },
) {
  if (!initialized) initSentryServer();
  Sentry.withScope((scope) => {
    if (context.correlation_id) scope.setTag('correlation_id', context.correlation_id);
    if (context.handler) scope.setTag('handler', context.handler);
    if (context.venture_id) scope.setTag('venture_id', context.venture_id);
    Sentry.captureException(err);
  });
}

export { Sentry };
