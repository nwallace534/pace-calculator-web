import { StateCreator } from "zustand";
import { CalculatorStore } from "./useCalculatorStore";

export const SAVED_DURATION_STORAGE_KEY = "pace-calculator:saved-durations";
export const SAVED_DURATION_STORAGE_VERSION = 1;
export const SAVED_DURATION_CAP = 5;
export const MAX_DURATION_SECONDS = 99 * 3600 + 59 * 60 + 59;

export const BUILT_IN_DURATION_PRESETS = [
  { id: "thirtyMinutes", seconds: 30 * 60 },
  { id: "oneHour", seconds: 60 * 60 },
  { id: "twoHours", seconds: 2 * 60 * 60 },
] as const;

export type SavedDuration = {
  id: string;
  seconds: number;
};

export type AddSavedDurationInput = Omit<SavedDuration, "id">;

export type AddSavedDurationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "duplicate-builtin" | "duplicate-saved" | "limit" | "invalid";
    };

export interface SavedDurationsSlice {
  savedDurations: SavedDuration[];
  addSavedDuration: (input: AddSavedDurationInput) => AddSavedDurationResult;
  removeSavedDuration: (id: string) => void;
}

const isValidSeconds = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value > 0 &&
  value <= MAX_DURATION_SECONDS;

const isBuiltInDuration = (seconds: number): boolean =>
  BUILT_IN_DURATION_PRESETS.some((preset) => preset.seconds === seconds);

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

export const loadSavedDurations = (): SavedDuration[] => {
  let raw: string | null;
  try {
    raw = window.localStorage?.getItem(SAVED_DURATION_STORAGE_KEY) ?? null;
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
    (parsed as { version: unknown }).version !== SAVED_DURATION_STORAGE_VERSION
  ) {
    return [];
  }

  const list = (parsed as { savedDurations: unknown }).savedDurations;
  if (!Array.isArray(list)) return [];

  const out: SavedDuration[] = [];
  for (const item of list) {
    if (out.length >= SAVED_DURATION_CAP) break;
    if (!item || typeof item !== "object") continue;
    const id = (item as { id: unknown }).id;
    const seconds = (item as { seconds: unknown }).seconds;
    if (typeof id !== "string" || id.length === 0) continue;
    if (!isValidSeconds(seconds)) continue;
    if (isBuiltInDuration(seconds)) continue;
    if (out.some((saved) => saved.seconds === seconds)) continue;
    out.push({ id, seconds });
  }
  return out;
};

const persistSavedDurations = (savedDurations: SavedDuration[]): void => {
  try {
    window.localStorage?.setItem(
      SAVED_DURATION_STORAGE_KEY,
      JSON.stringify({
        version: SAVED_DURATION_STORAGE_VERSION,
        savedDurations,
      }),
    );
  } catch {
    // localStorage may throw (private mode, quota). In-memory state still
    // updates; the next save attempt will retry persistence.
  }
};

export const createSavedDurationsSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  SavedDurationsSlice
> = (set, get) => ({
  savedDurations: loadSavedDurations(),
  addSavedDuration: (input) => {
    if (!isValidSeconds(input.seconds)) {
      return { ok: false, reason: "invalid" };
    }

    const current = get().savedDurations;
    if (current.length >= SAVED_DURATION_CAP) {
      return { ok: false, reason: "limit" };
    }
    if (isBuiltInDuration(input.seconds)) {
      return { ok: false, reason: "duplicate-builtin" };
    }
    if (current.some((saved) => saved.seconds === input.seconds)) {
      return { ok: false, reason: "duplicate-saved" };
    }

    const next: SavedDuration[] = [
      ...current,
      { id: generateId(), seconds: input.seconds },
    ];
    persistSavedDurations(next);
    set({ savedDurations: next });
    return { ok: true };
  },
  removeSavedDuration: (id) => {
    const current = get().savedDurations;
    if (!current.some((saved) => saved.id === id)) return;
    const next = current.filter((saved) => saved.id !== id);
    persistSavedDurations(next);
    set({ savedDurations: next });
  },
});
