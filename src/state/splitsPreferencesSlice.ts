import { StateCreator } from "zustand";
import { CalculatorStore } from "./useCalculatorStore";
import type { SplitsOverrideOptionKey } from "@/utils/splitsOverride";

export const SPLITS_PREFERENCES_STORAGE_KEY =
  "pace-calculator:splits-preferences";
export const SPLITS_PREFERENCES_STORAGE_VERSION = 1;

const VALID_KEYS: ReadonlySet<SplitsOverrideOptionKey> = new Set([
  "K",
  "miles",
  "hundredMeters",
  "laps",
]);

export interface SplitsPreferencesSlice {
  splitsPreferences: Record<string, SplitsOverrideOptionKey>;
  setSplitsPreference: (eventId: string, key: SplitsOverrideOptionKey) => void;
}

export const loadSplitsPreferences = (): Record<
  string,
  SplitsOverrideOptionKey
> => {
  let raw: string | null;
  try {
    raw = window.localStorage?.getItem(SPLITS_PREFERENCES_STORAGE_KEY) ?? null;
  } catch {
    return {};
  }
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as { version: unknown }).version !==
      SPLITS_PREFERENCES_STORAGE_VERSION
  ) {
    return {};
  }

  const prefs = (parsed as { preferences: unknown }).preferences;
  if (!prefs || typeof prefs !== "object") return {};

  const out: Record<string, SplitsOverrideOptionKey> = {};
  for (const [eventId, value] of Object.entries(prefs)) {
    if (typeof eventId !== "string" || eventId.length === 0) continue;
    if (typeof value !== "string") continue;
    if (!VALID_KEYS.has(value as SplitsOverrideOptionKey)) continue;
    out[eventId] = value as SplitsOverrideOptionKey;
  }
  return out;
};

const persistSplitsPreferences = (
  preferences: Record<string, SplitsOverrideOptionKey>,
): void => {
  try {
    window.localStorage?.setItem(
      SPLITS_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        version: SPLITS_PREFERENCES_STORAGE_VERSION,
        preferences,
      }),
    );
  } catch {
    // localStorage may throw (private mode, quota). In-memory state still
    // updates; the next save attempt will retry persistence.
  }
};

export const createSplitsPreferencesSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  SplitsPreferencesSlice
> = (set, get) => ({
  splitsPreferences: loadSplitsPreferences(),
  setSplitsPreference: (eventId, key) => {
    if (get().splitsPreferences[eventId] === key) return;
    const next = { ...get().splitsPreferences, [eventId]: key };
    persistSplitsPreferences(next);
    set({ splitsPreferences: next });
  },
});
