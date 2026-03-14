// 🔍 Sentry Error Monitoring — Karyika
import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.log("⚠️ Sentry DSN not set — error monitoring disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: "karyika@" + (import.meta.env.VITE_APP_VERSION || "1.0.0"),
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      /^Loading chunk/,
    ],
    beforeSend(event, hint) {
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEV) {
        console.group("🔍 Sentry (dev - not sent)");
        console.error(hint?.originalException || event);
        console.groupEnd();
        return null;
      }
      return event;
    },
  });
  console.log("✅ Sentry initialized");
}

export function captureError(error, context = {}) {
  Sentry.withScope(scope => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(error);
  });
}

export function captureMessage(msg, level = "info") {
  Sentry.captureMessage(msg, level);
}

export function setUser(user) {
  if (user) Sentry.setUser({ id: user.uid, email: user.email });
  else Sentry.setUser(null);
}

export { Sentry };
