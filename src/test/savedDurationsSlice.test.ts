import { describe, expect, it } from "vitest";
import useCalculatorStore from "@/state/useCalculatorStore";
import {
  SAVED_DURATION_CAP,
  SAVED_DURATION_STORAGE_KEY,
  SAVED_DURATION_STORAGE_VERSION,
  loadSavedDurations,
} from "@/state/savedDurationsSlice";

const store = useCalculatorStore;

describe("savedDurationsSlice — add", () => {
  it("accepts a valid custom duration and persists it", () => {
    const result = store.getState().addSavedDuration({ seconds: 22 * 60 });

    expect(result).toEqual({ ok: true });
    expect(store.getState().savedDurations).toHaveLength(1);
    expect(store.getState().savedDurations[0]).toMatchObject({
      seconds: 22 * 60,
    });

    const raw = window.localStorage.getItem(SAVED_DURATION_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(SAVED_DURATION_STORAGE_VERSION);
    expect(parsed.savedDurations).toHaveLength(1);
  });

  it("rejects empty, duplicate built-in, duplicate saved, and over-cap values", () => {
    expect(store.getState().addSavedDuration({ seconds: 0 })).toEqual({
      ok: false,
      reason: "invalid",
    });

    expect(store.getState().addSavedDuration({ seconds: 30 * 60 })).toEqual({
      ok: false,
      reason: "duplicate-builtin",
    });

    store.getState().addSavedDuration({ seconds: 22 * 60 });
    expect(store.getState().addSavedDuration({ seconds: 22 * 60 })).toEqual({
      ok: false,
      reason: "duplicate-saved",
    });

    for (const seconds of [5, 6, 7, 8]) {
      store.getState().addSavedDuration({ seconds });
    }
    expect(store.getState().savedDurations).toHaveLength(SAVED_DURATION_CAP);
    expect(store.getState().addSavedDuration({ seconds: 9 })).toEqual({
      ok: false,
      reason: "limit",
    });
  });
});

describe("savedDurationsSlice — remove", () => {
  it("removes by id and persists", () => {
    store.getState().addSavedDuration({ seconds: 22 * 60 });
    const id = store.getState().savedDurations[0].id;

    store.getState().removeSavedDuration(id);

    expect(store.getState().savedDurations).toHaveLength(0);
    const parsed = JSON.parse(
      window.localStorage.getItem(SAVED_DURATION_STORAGE_KEY)!,
    );
    expect(parsed.savedDurations).toHaveLength(0);
  });
});

describe("loadSavedDurations — hydration validation", () => {
  it("keeps valid items and drops malformed, duplicate, built-in, and over-cap items", () => {
    window.localStorage.setItem(
      SAVED_DURATION_STORAGE_KEY,
      JSON.stringify({
        version: SAVED_DURATION_STORAGE_VERSION,
        savedDurations: [
          { id: "empty", seconds: 0 },
          { id: "builtin", seconds: 60 * 60 },
          { id: "valid-a", seconds: 5 },
          { id: "duplicate", seconds: 5 },
          { id: "", seconds: 6 },
          { id: "string", seconds: "7" },
          { id: "valid-b", seconds: 8 },
          { id: "valid-c", seconds: 9 },
          { id: "valid-d", seconds: 10 },
          { id: "valid-e", seconds: 11 },
          { id: "over-cap", seconds: 12 },
        ],
      }),
    );

    expect(loadSavedDurations()).toEqual([
      { id: "valid-a", seconds: 5 },
      { id: "valid-b", seconds: 8 },
      { id: "valid-c", seconds: 9 },
      { id: "valid-d", seconds: 10 },
      { id: "valid-e", seconds: 11 },
    ]);
  });
});
