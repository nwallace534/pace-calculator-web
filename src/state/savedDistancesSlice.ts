import { StateCreator } from "zustand";
import { DistanceUnit, getDistanceInAllUnits } from "pace-calculator";
import { CalculatorStore } from "./useCalculatorStore";
import { DISTANCE_MATCH_TOLERANCE_METERS } from "@/utils/distances";
import { eventDistancesInMeters } from "@/utils/events";
import { getCalculationUpdate } from "@/utils/calculator";
import { extractCalculatorInput } from "@/utils/extractCalculatorInput";
import { track } from "@/utils/analytics";
import { AnalyticsEvent } from "@/utils/analytics-events";

export const SAVED_DISTANCE_CAP = 5;
const MAX_DISPLAY_VALUE = 100000;

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

// Typed against the full CalculatorStore so set/get see the whole state — the
// setters recompute timesForPace via getCalculationUpdate, which needs the
// other slices' fields (distance, time, computeMode, etc.).
export const createSavedDistancesSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  SavedDistancesSlice
> = (set, get) => ({
  savedDistances: [],
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

    // Recompute timesForPace so the new row appears immediately. Mirrors the
    // pattern in distanceSlice setters.
    const calculationUpdate = getCalculationUpdate({
      ...extractCalculatorInput(get()),
      savedDistances: next,
    });
    set({ savedDistances: next, ...calculationUpdate });

    track(AnalyticsEvent.SavedDistanceAdded);
    return { ok: true };
  },
  removeSavedDistance: (id) => {
    const current = get().savedDistances;
    if (!current.some((s) => s.id === id)) return;
    const next = current.filter((s) => s.id !== id);

    const calculationUpdate = getCalculationUpdate({
      ...extractCalculatorInput(get()),
      savedDistances: next,
    });
    set({ savedDistances: next, ...calculationUpdate });

    track(AnalyticsEvent.SavedDistanceRemoved);
  },
});
