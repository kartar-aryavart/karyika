// 🔍 Sentry Error Monitoring — Karyika
// Safe version — build passes even without @sentry/react installed

const DSN = import.meta.env.VITE_SENTRY_DSN;

let _sentry = null;

// Lazy load Sentry only if DSN is set
async function getSentry() {
  if (!DSN) return null;
  if (_sentry) return _sentry;
  try {
    _sentry = await import("@sentry/react");
    return _sentry;
  } catch {
    return null;
  }
}

export async function initSentry() {
  if (!DSN) {
    console.log("ℹ️ Sentry DSN not set — skipping");
    return;
  }
  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: "karyika@" + (import.meta.env.VITE_APP_VERSION || "1.0.0"),
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false }),
    ],
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection",
      /^Loading chunk/,
    ],
    beforeSend(event, hint) {
      if (import.meta.env.DEV) {
        console.group("🔍 Sentry (dev)");
        console.error(hint?.originalException || event);
        console.groupEnd();
        return null; // Don't send in dev
      }
      return event;
    },
  });
  console.log("✅ Sentry active");
}

export async function captureError(error, context = {}) {
  const Sentry = await getSentry();
  if (!Sentry) return;
  Sentry.withScope(scope => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(error);
  });
}

export async function setUser(user) {
  const Sentry = await getSentry();
  if (!Sentry) return;
  if (user) Sentry.setUser({ id: user.uid, email: user.email });
  else Sentry.setUser(null);
}
