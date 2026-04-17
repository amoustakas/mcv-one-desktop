import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentryClient() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.info('[sentry] VITE_SENTRY_DSN not set — Sentry disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? 'local',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // PII redaction - drop auth headers, cookies, raw request bodies with credentials
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

export function tagVentureContext(ventureId: string | null) {
  if (!initialized) return;
  if (ventureId) {
    Sentry.setTag('venture_id', ventureId);
    Sentry.setContext('venture', { id: ventureId });
  } else {
    Sentry.setTag('venture_id', null);
  }
}

export { Sentry };
