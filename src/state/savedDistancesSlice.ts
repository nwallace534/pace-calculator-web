import { StateCreator } from "zustand";
import { DistanceUnit, getDistanceInAllUnits } from "pace-calculator";
import { CalculatorStore } from "./useCalculatorStore";
import { DISTANCE_MATCH_TOLERANCE_METERS } from "@/utils/distances";
import { eventDistancesInMeters } from "@/utils/events";
import { getCalculationUpdate } from "@/utils/calculator";
import { extractCalculatorInput } from "@/utils/extractCalculatorInput";
import { track } from "@/utils/analytics";
import { AnalyticsEvent } from "@/utils/analytics-events";

export const STORAGE_KEY = "pace-calculator:saved-distances";
export const STORAGE_VERSION = 1;
export const SAVED_DISTANCE_CAP = 5;
const MAX_DISPLAY_VALUE = 100000;
const MAX_METERS = 200_000_000;

export type SavedDistance = {
  id: string;
  distanceValue: number;
  distanceUnit: DistanceUnit;
};

export type AddSavedDistanceInput = Omit<SavedDistance, "id">;

export type AddSavedDistanceResult =
  | { ok: true }
  | {
      ok: false;
      reason: "duplicate-builtin" | "duplicate-saved" | "limit" | "invalid";
      matchedBuiltInId?: string;
    };

export interface SavedDistancesSlice {
  savedDistances: SavedDistance[];
  addSavedDistance: (input: AddSavedDistanceInput) => AddSavedDistanceResult;
  removeSavedDistance: (id: string) => void;
}

const VALID_UNITS: ReadonlySet<DistanceUnit> = new Set(
  Object.values(DistanceUnit),
);

const isValidUnit = (u: unknown): u is DistanceUnit =>
  typeof u === "string" && VALID_UNITS.has(u as DistanceUnit);

const isValidDisplayValue = (v: unknown): v is number =>
  typeof v === "number" &&
  Number.isFinite(v) &&
  v > 0 &&
  v <= MAX_DISPLAY_VALUE;

const toMeters = (distanceValue: number, distanceUnit: DistanceUnit): number =>
  getDistanceInAllUnits({ distanceValue, distanceUnit }).inMeters.distanceValue;

const findBuiltInMatch = (meters: number): string | undefined =>
  Object.entries(eventDistancesInMeters).find(
    ([, m]) => Math.abs(m - meters) < DISTANCE_MATCH_TOLERANCE_METERS,
  )?.[0];

// crypto.randomUUID requires a secure context. iOS Safari over plain HTTP
// (dev server reached via LAN IP) throws, so fall back to a time+random id
// — non-cryptographic, but the cap of 5 saved distances makes collisions
// vanishingly unlikely.
const generateId = (): string => {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const findSavedMatch = (
  meters: number,
  saved: SavedDistance[],
): SavedDistance | undefined =>
  saved.find(
    (s) =>
      Math.abs(toMeters(s.distanceValue, s.distanceUnit) - meters) <
      DISTANCE_MATCH_TOLERANCE_METERS,
  );

// Hydration validator — runs at slice init AND is exported for unit tests.
// Per-item validation so one bad entry doesn't drop the whole list.
export const loadSavedDistances = (): SavedDistance[] => {
  let raw: string | null;
  try {
    raw = window.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return [];
  }
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as { version: unknown }).version !== STORAGE_VERSION
  ) {
    return [];
  }

  const list = (parsed as { savedDistances: unknown }).savedDistances;
  if (!Array.isArray(list)) return [];

  const out: SavedDistance[] = [];
  for (const item of list) {
    if (out.length >= SAVED_DISTANCE_CAP) break;
    if (!item || typeof item !== "object") continue;
    const id = (item as { id: unknown }).id;
    const distanceValue = (item as { distanceValue: unknown }).distanceValue;
    const distanceUnit = (item as { distanceUnit: unknown }).distanceUnit;
    if (typeof id !== "string" || id.length === 0) continue;
    if (!isValidDisplayValue(distanceValue)) continue;
    if (!isValidUnit(distanceUnit)) continue;
    out.push({ id, distanceValue, distanceUnit });
  }
  return out;
};

const persistSavedDistances = (savedDistances: SavedDistance[]): void => {
  try {
    window.localStorage?.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, savedDistances }),
    );
  } catch {
    // localStorage may throw (private mode, quota). In-memory state still
    // updates; the next save attempt will retry persistence.
  }
};

// Single egress point for analytics payloads on these events. Returns null
// if any check fails; the call site treats null as "skip tracking" rather
// than emit a malformed event.
export const buildSavedDistancePayload = (
  input: AddSavedDistanceInput,
): { unit: DistanceUnit; displayValue: number; meters: number } | null => {
  if (!isValidUnit(input.distanceUnit)) return null;
  const coerced = Number(input.distanceValue);
  if (!isValidDisplayValue(coerced)) return null;
  const metersRaw = toMeters(coerced, input.distanceUnit);
  if (!Number.isFinite(metersRaw) || metersRaw <= 0 || metersRaw > MAX_METERS) {
    return null;
  }
  return {
    unit: input.distanceUnit,
    displayValue: coerced,
    meters: Math.round(metersRaw),
  };
};

// Typed against the full CalculatorStore so set/get see the whole state — the
// setters recompute timesForPace via getCalculationUpdate, which needs the
// other slices' fields (distance, time, computeMode, etc.).
export const createSavedDistancesSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  SavedDistancesSlice
> = (set, get) => ({
  savedDistances: loadSavedDistances(),
  addSavedDistance: (input) => {
    if (!isValidUnit(input.distanceUnit))
      return { ok: false, reason: "invalid" };
    if (!isValidDisplayValue(input.distanceValue))
      return { ok: false, reason: "invalid" };

    const current = get().savedDistances;
    if (current.length >= SAVED_DISTANCE_CAP) {
      return { ok: false, reason: "limit" };
    }

    const meters = toMeters(input.distanceValue, input.distanceUnit);
    const matchedBuiltInId = findBuiltInMatch(meters);
    if (matchedBuiltInId) {
      return { ok: false, reason: "duplicate-builtin", matchedBuiltInId };
    }
    if (findSavedMatch(meters, current)) {
      return { ok: false, reason: "duplicate-saved" };
    }

    const next: SavedDistance[] = [
      ...current,
      {
        id: generateId(),
        distanceValue: input.distanceValue,
        distanceUnit: input.distanceUnit,
      },
    ];
    persistSavedDistances(next);

    // Recompute timesForPace so the new row appears immediately. Mirrors the
    // pattern in distanceSlice setters.
    const calculationUpdate = getCalculationUpdate({
      ...extractCalculatorInput(get()),
      savedDistances: next,
    });
    set({ savedDistances: next, ...calculationUpdate });

    const payload = buildSavedDistancePayload(input);
    if (payload) track(AnalyticsEvent.SavedDistanceAdded, payload);
    return { ok: true };
  },
  removeSavedDistance: (id) => {
    const current = get().savedDistances;
    const target = current.find((s) => s.id === id);
    if (!target) return;
    const next = current.filter((s) => s.id !== id);
    persistSavedDistances(next);

    const calculationUpdate = getCalculationUpdate({
      ...extractCalculatorInput(get()),
      savedDistances: next,
    });
    set({ savedDistances: next, ...calculationUpdate });

    const payload = buildSavedDistancePayload({
      distanceValue: target.distanceValue,
      distanceUnit: target.distanceUnit,
    });
    if (payload) track(AnalyticsEvent.SavedDistanceRemoved, payload);
  },
});
