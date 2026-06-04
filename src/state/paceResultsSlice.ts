import { StateCreator } from "zustand";
import { MultiPace, Time } from "pace-calculator";
import { SplitsResult } from "@/utils/calculator";

export interface PaceResultsSlice {
  paceResults: MultiPace | null;
  timesForPace: Record<string, Time> | null;
  splits: SplitsResult | null;
}

export const createPaceResultsSlice: StateCreator<
  PaceResultsSlice,
  [],
  [],
  PaceResultsSlice
> = (): PaceResultsSlice => ({
  paceResults: null,
  timesForPace: null,
  splits: null,
});
