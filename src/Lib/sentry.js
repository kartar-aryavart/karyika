// 🔍 Sentry Error Monitoring — Karyika (Static import version)
import * as Sentry from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!DSN) { console.log("ℹ️ Sentry DSN not set"); return; }

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: "karyika@" + (import.meta.env.VITE_APP_VERSION || "1.0.0"),
    tracesSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false }),
    ],
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      /^Loading chunk/,
    ],
    beforeSend(event) {
      // Dev mein console mein dikhao, Sentry ko mat bhejo
      if (import.meta.env.DEV) return null;
      return event;
    },
  });
  console.log("✅ Sentry active —", import.meta.env.MODE);
}

export function captureError(error, context = {}) {
  if (!DSN) return;
  Sentry.withScope(scope => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(error);
  });
}

export function setUser(user) {
  if (!DSN) return;
  if (user) Sentry.setUser({ id: user.uid, email: user.email });
  else Sentry.setUser(null);
}
