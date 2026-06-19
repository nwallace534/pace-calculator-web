import { describe, expect, it } from "vitest";
import useCalculatorStore from "@/state/useCalculatorStore";
import { SAVED_DURATION_CAP } from "@/state/savedDurationsSlice";

const store = useCalculatorStore;

describe("savedDurationsSlice — add", () => {
  it("accepts a valid custom duration", () => {
    const result = store.getState().addSavedDuration({ seconds: 22 * 60 });

    expect(result).toEqual({ ok: true });
    expect(store.getState().savedDurations).toHaveLength(1);
    expect(store.getState().savedDurations[0]).toMatchObject({
      seconds: 22 * 60,
    });
  });

  it("does not persist to localStorage on add", () => {
    store.getState().addSavedDuration({ seconds: 22 * 60 });

    expect(window.localStorage.length).toBe(0);
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
  it("removes by id", () => {
    store.getState().addSavedDuration({ seconds: 22 * 60 });
    const id = store.getState().savedDurations[0].id;

    store.getState().removeSavedDuration(id);

    expect(store.getState().savedDurations).toHaveLength(0);
  });
});
