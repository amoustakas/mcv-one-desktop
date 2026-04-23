// HTTP step handler. Intentionally thin — no retry, no exponential backoff;
// those policies live at the workflow runner level.

import type { HttpStep } from '../types';
import { renderTemplate } from './dispatch-agent';

export interface HttpStepContext {
  variables: Record<string, unknown>;
  /** Override for tests */
  fetchImpl?: typeof fetch;
}

export interface HttpStepResult {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
}

export async function runHttpStep(step: HttpStep, ctx: HttpStepContext): Promise<HttpStepResult> {
  const url = renderTemplate(step.urlTemplate, ctx.variables);
  const f = ctx.fetchImpl ?? fetch;
  const startedAt = Date.now();

  const controller = new AbortController();
  const timeoutMs = step.timeoutMs ?? 30_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await f(url, {
      method: step.method,
      headers: step.headers,
      body: step.bodyTemplate !== undefined ? JSON.stringify(step.bodyTemplate) : undefined,
      signal: controller.signal,
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    return {
      status: response.status,
      headers: responseHeaders,
      body,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}
