import { describe, expect, it } from "vitest";
import useCalculatorStore from "@/state/useCalculatorStore";
import {
  SPLITS_PREFERENCES_STORAGE_KEY,
  SPLITS_PREFERENCES_STORAGE_VERSION,
  loadSplitsPreferences,
} from "@/state/splitsPreferencesSlice";

const store = useCalculatorStore;

describe("splitsPreferencesSlice — setSplitsPreference", () => {
  it("stores the chosen option key under the event id and persists it", () => {
    store.getState().setSplitsPreference("fiveK", "miles");

    expect(store.getState().splitsPreferences).toEqual({ fiveK: "miles" });

    const raw = window.localStorage.getItem(SPLITS_PREFERENCES_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(SPLITS_PREFERENCES_STORAGE_VERSION);
    expect(parsed.preferences).toEqual({ fiveK: "miles" });
  });

  it("merges new event preferences into the existing record without dropping prior entries", () => {
    store.getState().setSplitsPreference("fiveK", "miles");
    store.getState().setSplitsPreference("marathon", "K");

    expect(store.getState().splitsPreferences).toEqual({
      fiveK: "miles",
      marathon: "K",
    });
  });

  it("overrides the saved key when the user changes their mind on the same event", () => {
    store.getState().setSplitsPreference("tenK", "K");
    store.getState().setSplitsPreference("tenK", "miles");

    expect(store.getState().splitsPreferences).toEqual({ tenK: "miles" });
  });

  it("is a no-op when the same key is set again (no storage churn)", () => {
    store.getState().setSplitsPreference("fiveK", "miles");
    const firstWrite = window.localStorage.getItem(
      SPLITS_PREFERENCES_STORAGE_KEY,
    );

    // Setting the same key shouldn't trigger another persist write, so the
    // raw JSON should remain identically equal (same string instance).
    store.getState().setSplitsPreference("fiveK", "miles");
    const secondWrite = window.localStorage.getItem(
      SPLITS_PREFERENCES_STORAGE_KEY,
    );

    expect(secondWrite).toBe(firstWrite);
  });
});

describe("loadSplitsPreferences — hydration validation", () => {
  it("returns an empty record when no preferences have been saved", () => {
    expect(loadSplitsPreferences()).toEqual({});
  });

  it("keeps valid entries and drops unknown keys, malformed values, and empty event ids", () => {
    window.localStorage.setItem(
      SPLITS_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        version: SPLITS_PREFERENCES_STORAGE_VERSION,
        preferences: {
          fiveK: "K",
          marathon: "miles",
          mile: "laps",
          oneHundredMeters: "hundredMeters",
          // Invalid: unknown option key.
          tenK: "bogusKey",
          // Invalid: empty event id.
          "": "K",
          // Invalid: non-string value.
          halfMarathon: 42,
        },
      }),
    );

    expect(loadSplitsPreferences()).toEqual({
      fiveK: "K",
      marathon: "miles",
      mile: "laps",
      oneHundredMeters: "hundredMeters",
    });
  });

  it("returns empty when the stored version doesn't match the current schema", () => {
    window.localStorage.setItem(
      SPLITS_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        version: SPLITS_PREFERENCES_STORAGE_VERSION + 1,
        preferences: { fiveK: "miles" },
      }),
    );

    expect(loadSplitsPreferences()).toEqual({});
  });

  it("returns empty when the stored JSON is malformed", () => {
    window.localStorage.setItem(
      SPLITS_PREFERENCES_STORAGE_KEY,
      "not valid json {",
    );
    expect(loadSplitsPreferences()).toEqual({});
  });

  it("returns empty when the payload is missing the preferences object", () => {
    window.localStorage.setItem(
      SPLITS_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ version: SPLITS_PREFERENCES_STORAGE_VERSION }),
    );
    expect(loadSplitsPreferences()).toEqual({});
  });
});
