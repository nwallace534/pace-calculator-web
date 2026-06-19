import { describe, it, expect } from "vitest";
import { DistanceUnit } from "pace-calculator";
import useCalculatorStore from "@/state/useCalculatorStore";

const store = useCalculatorStore;

describe("savedDistancesSlice — add", () => {
  it("accepts a valid distance and returns ok", () => {
    const result = store.getState().addSavedDistance({
      distanceValue: 10,
      distanceUnit: DistanceUnit.Miles,
    });

    expect(result).toEqual({ ok: true });
    expect(store.getState().savedDistances).toHaveLength(1);
    expect(store.getState().savedDistances[0]).toMatchObject({
      distanceValue: 10,
      distanceUnit: DistanceUnit.Miles,
    });
    expect(store.getState().savedDistances[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects empty or zero distance", () => {
    const result = store.getState().addSavedDistance({
      distanceValue: 0,
      distanceUnit: DistanceUnit.Miles,
    });

    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(store.getState().savedDistances).toHaveLength(0);
  });

  it("rejects a duplicate of an existing saved distance within 0.5m tolerance", () => {
    store.getState().addSavedDistance({
      distanceValue: 10,
      distanceUnit: DistanceUnit.Miles,
    });

    // 16093m is 10 mi to within float drift; should be detected as duplicate.
    const result = store.getState().addSavedDistance({
      distanceValue: 16093,
      distanceUnit: DistanceUnit.Meters,
    });
    expect(result).toEqual({ ok: false, reason: "duplicate-saved" });
    expect(store.getState().savedDistances).toHaveLength(1);
  });

  it("rejects a duplicate of a built-in event distance", () => {
    const result = store.getState().addSavedDistance({
      distanceValue: 5,
      distanceUnit: DistanceUnit.Kilometers,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("duplicate-builtin");
      expect(result.matchedBuiltInId).toBe("fiveK");
    }
    expect(store.getState().savedDistances).toHaveLength(0);
  });

  it("enforces the cap of 5", () => {
    // 5 distinct distances chosen to avoid colliding with any built-in event.
    for (const v of [2, 3, 4, 6, 8]) {
      store.getState().addSavedDistance({
        distanceValue: v,
        distanceUnit: DistanceUnit.Miles,
      });
    }

    expect(store.getState().savedDistances).toHaveLength(5);
    const result = store.getState().addSavedDistance({
      distanceValue: 9,
      distanceUnit: DistanceUnit.Miles,
    });
    expect(result).toEqual({ ok: false, reason: "limit" });
    expect(store.getState().savedDistances).toHaveLength(5);
  });

  it("does not persist to localStorage on add", () => {
    store.getState().addSavedDistance({
      distanceValue: 10,
      distanceUnit: DistanceUnit.Miles,
    });

    expect(window.localStorage.length).toBe(0);
  });
});

describe("savedDistancesSlice — remove", () => {
  it("removes by id", () => {
    store.getState().addSavedDistance({
      distanceValue: 10,
      distanceUnit: DistanceUnit.Miles,
    });

    const id = store.getState().savedDistances[0].id;
    store.getState().removeSavedDistance(id);
    expect(store.getState().savedDistances).toHaveLength(0);
  });

  it("is a no-op for an unknown id", () => {
    store.getState().addSavedDistance({
      distanceValue: 10,
      distanceUnit: DistanceUnit.Miles,
    });

    store.getState().removeSavedDistance("not-a-real-id");
    expect(store.getState().savedDistances).toHaveLength(1);
  });
});
