// PostHog is loaded lazily via a dynamic import so it stays out of the
// critical bundle. Events fired before it arrives are queued and flushed.
// Missing VITE_POSTHOG_KEY → every call no-ops silently (local dev, forks).

import { AnalyticsEventName } from "./analytics-events";

type Props = Record<string, unknown>;

// Type-only import — nothing from posthog-js is bundled until the dynamic
// import below runs.
type PostHog = Awaited<typeof import("posthog-js")>["default"];

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com";

let ph: PostHog | null = null;
let loadStarted = false;
const queue: Array<(instance: PostHog) => void> = [];
// Page-lifetime dedupe for trackOnce. Reload resets it — the intended scope.
const firedOnce = new Set<string>();

const flush = () => {
  if (!ph) return;
  while (queue.length) {
    const fn = queue.shift();
    if (fn) fn(ph);
  }
};

const callOrQueue = (fn: (instance: PostHog) => void) => {
  if (ph) fn(ph);
  else queue.push(fn);
};

export const initAnalytics = () => {
  if (loadStarted || !KEY) return;
  loadStarted = true;

  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        // Cookieless: no consent banner. Trade-off: returning visitors look new.
        persistence: "memory",
        autocapture: false,
        disable_session_recording: true,
        capture_pageview: true,
        capture_pageleave: true, // needed for time-on-page
      });
      ph = posthog;
      flush();
    })
    .catch(() => {
      // Analytics load failure (ad-blocker, offline) must never break the app.
    });
};

export const track = (event: AnalyticsEventName, props?: Props) => {
  if (!KEY) return;
  callOrQueue((instance) => instance.capture(event, props));
};

// Fires only the first time per page lifetime — for "did the user ever touch
// this feature" signals that would otherwise drown the dashboard.
export const trackOnce = (event: AnalyticsEventName, props?: Props) => {
  if (!KEY) return;
  if (firedOnce.has(event)) return;
  firedOnce.add(event);
  callOrQueue((instance) => instance.capture(event, props));
};
