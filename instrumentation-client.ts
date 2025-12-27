// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

function numEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (!raw) return fallback
  return raw === 'true' ? true : raw === 'false' ? false : fallback
}

Sentry.init({
  // Prefer env-provided DSN, but keep a safe fallback so existing deploys keep reporting.
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://885f2cab6dee39efeed7c27fe1fbfa0a@o4509980151840768.ingest.de.sentry.io/4510491050967120",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: numEnv('SENTRY_TRACES_SAMPLE_RATE', 0.1),
  // Enable logs to be sent to Sentry
  enableLogs: boolEnv('SENTRY_ENABLE_LOGS', false),

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: numEnv('SENTRY_REPLAYS_SESSION_SAMPLE_RATE', 0.0),

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: numEnv('SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE', 0.1),

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: boolEnv('SENTRY_SEND_DEFAULT_PII', false),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;