import { StateCreator } from "zustand";
import { CalculatorStore } from "./useCalculatorStore";

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

export const createSavedDurationsSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  SavedDurationsSlice
> = (set, get) => ({
  savedDurations: [],
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
    set({ savedDurations: next });
    return { ok: true };
  },
  removeSavedDuration: (id) => {
    const current = get().savedDurations;
    if (!current.some((saved) => saved.id === id)) return;
    const next = current.filter((saved) => saved.id !== id);
    set({ savedDurations: next });
  },
});
