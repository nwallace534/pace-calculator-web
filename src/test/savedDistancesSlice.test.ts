import { describe, it, expect } from "vitest";
import { DistanceUnit } from "pace-calculator";
import useCalculatorStore from "@/state/useCalculatorStore";
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  buildSavedDistancePayload,
  loadSavedDistances,
} from "@/state/savedDistancesSlice";

const store = useCalculatorStore;

describe("savedDistancesSlice — add", () => {
  it("accepts a valid distance and returns ok", () => {
    const result = store
      .getState()
      .addSavedDistance({
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
    const result = store
      .getState()
      .addSavedDistance({ distanceValue: 0, distanceUnit: DistanceUnit.Miles });
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(store.getState().savedDistances).toHaveLength(0);
  });

  it("rejects a duplicate of an existing saved distance within 0.5m tolerance", () => {
    store
      .getState()
      .addSavedDistance({
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
    const result = store
      .getState()
      .addSavedDistance({ distanceValue: 9, distanceUnit: DistanceUnit.Miles });
    expect(result).toEqual({ ok: false, reason: "limit" });
    expect(store.getState().savedDistances).toHaveLength(5);
  });

  it("persists to localStorage on add", () => {
    store
      .getState()
      .addSavedDistance({
        distanceValue: 10,
        distanceUnit: DistanceUnit.Miles,
      });
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.version).toBe(STORAGE_VERSION);
    expect(parsed.savedDistances).toHaveLength(1);
  });
});

describe("savedDistancesSlice — remove", () => {
  it("removes by id and persists", () => {
    store
      .getState()
      .addSavedDistance({
        distanceValue: 10,
        distanceUnit: DistanceUnit.Miles,
      });
    const id = store.getState().savedDistances[0].id;
    store.getState().removeSavedDistance(id);
    expect(store.getState().savedDistances).toHaveLength(0);
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(parsed.savedDistances).toHaveLength(0);
  });

  it("is a no-op for an unknown id", () => {
    store
      .getState()
      .addSavedDistance({
        distanceValue: 10,
        distanceUnit: DistanceUnit.Miles,
      });
    store.getState().removeSavedDistance("not-a-real-id");
    expect(store.getState().savedDistances).toHaveLength(1);
  });
});

describe("loadSavedDistances — hydration validation", () => {
  it("returns [] when storage is empty", () => {
    expect(loadSavedDistances()).toEqual([]);
  });

  it("returns [] when storage is malformed JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadSavedDistances()).toEqual([]);
  });

  it("returns [] when the version doesn't match", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 999,
        savedDistances: [
          {
            id: "a",
            distanceValue: 10,
            distanceUnit: DistanceUnit.Miles,
          },
        ],
      }),
    );
    expect(loadSavedDistances()).toEqual([]);
  });

  it("drops items with invalid unit but keeps valid ones", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        savedDistances: [
          { id: "a", distanceValue: 10, distanceUnit: "Furlongs" },
          { id: "b", distanceValue: 5, distanceUnit: DistanceUnit.Kilometers },
        ],
      }),
    );
    const result = loadSavedDistances();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("drops items with non-finite or out-of-range distanceValue", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        savedDistances: [
          { id: "a", distanceValue: 0, distanceUnit: DistanceUnit.Miles },
          { id: "b", distanceValue: -5, distanceUnit: DistanceUnit.Miles },
          { id: "c", distanceValue: 1e10, distanceUnit: DistanceUnit.Miles },
          { id: "d", distanceValue: "ten", distanceUnit: DistanceUnit.Miles },
          { id: "e", distanceValue: 10, distanceUnit: DistanceUnit.Miles },
        ],
      }),
    );
    const result = loadSavedDistances();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("e");
  });

  it("drops items missing or with empty id", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        savedDistances: [
          { distanceValue: 10, distanceUnit: DistanceUnit.Miles },
          { id: "", distanceValue: 10, distanceUnit: DistanceUnit.Miles },
          {
            id: "good",
            distanceValue: 5,
            distanceUnit: DistanceUnit.Kilometers,
          },
        ],
      }),
    );
    const result = loadSavedDistances();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("good");
  });

  it("truncates hydrated list to the cap when storage has more than the cap", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: `id-${i}`,
      distanceValue: i + 0.05,
      distanceUnit: DistanceUnit.Kilometers,
    }));
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, savedDistances: items }),
    );
    const result = loadSavedDistances();
    expect(result).toHaveLength(5);
    expect(result.map((s) => s.id)).toEqual([
      "id-0",
      "id-1",
      "id-2",
      "id-3",
      "id-4",
    ]);
  });
});

describe("buildSavedDistancePayload — analytics sanitiser", () => {
  it("returns a sanitised payload for valid input", () => {
    const payload = buildSavedDistancePayload({
      distanceValue: 10,
      distanceUnit: DistanceUnit.Miles,
    });
    expect(payload).toEqual({
      unit: DistanceUnit.Miles,
      displayValue: 10,
      meters: 16093, // 10 mi ≈ 16093.44m → rounded
    });
  });

  it("rounds meters to integer", () => {
    const payload = buildSavedDistancePayload({
      distanceValue: 1,
      distanceUnit: DistanceUnit.Kilometers,
    });
    expect(payload).toEqual({
      unit: DistanceUnit.Kilometers,
      displayValue: 1,
      meters: 1000,
    });
  });

  it("returns null for invalid unit", () => {
    expect(
      buildSavedDistancePayload({
        distanceValue: 10,
        // @ts-expect-error — deliberately invalid unit
        distanceUnit: "Furlongs",
      }),
    ).toBeNull();
  });

  it("returns null for non-finite distanceValue", () => {
    expect(
      buildSavedDistancePayload({
        distanceValue: Number.NaN,
        distanceUnit: DistanceUnit.Miles,
      }),
    ).toBeNull();
    expect(
      buildSavedDistancePayload({
        distanceValue: Number.POSITIVE_INFINITY,
        distanceUnit: DistanceUnit.Miles,
      }),
    ).toBeNull();
  });

  it("returns null for zero, negative, or over-large distanceValue", () => {
    expect(
      buildSavedDistancePayload({
        distanceValue: 0,
        distanceUnit: DistanceUnit.Miles,
      }),
    ).toBeNull();
    expect(
      buildSavedDistancePayload({
        distanceValue: -1,
        distanceUnit: DistanceUnit.Miles,
      }),
    ).toBeNull();
    expect(
      buildSavedDistancePayload({
        distanceValue: 100001,
        distanceUnit: DistanceUnit.Miles,
      }),
    ).toBeNull();
  });

  it("output object has only the three documented keys", () => {
    const payload = buildSavedDistancePayload({
      distanceValue: 5,
      distanceUnit: DistanceUnit.Kilometers,
    })!;
    expect(Object.keys(payload).sort()).toEqual([
      "displayValue",
      "meters",
      "unit",
    ]);
  });
});
