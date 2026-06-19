import { StateCreator } from "zustand";
import { CalculatorStore } from "./useCalculatorStore";
import type { SplitsViewOptionKey } from "@/utils/splitsView";

export interface SplitsViewSlice {
  splitsViewSelections: Record<string, SplitsViewOptionKey>;
  setSplitsViewSelection: (eventId: string, key: SplitsViewOptionKey) => void;
}

export const createSplitsViewSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  SplitsViewSlice
> = (set, get) => ({
  splitsViewSelections: {},
  setSplitsViewSelection: (eventId, key) => {
    if (get().splitsViewSelections[eventId] === key) return;
    set({
      splitsViewSelections: {
        ...get().splitsViewSelections,
        [eventId]: key,
      },
    });
  },
});
