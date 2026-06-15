import { StateCreator } from "zustand";
import { MultiPace, Time } from "pace-calculator";
import { SplitsResult } from "@/utils/calculator";
import type { IntervalRow, SummaryPredictionRow } from "@/modules/summaryRows";

export interface PaceResultsSlice {
  paceResults: MultiPace | null;
  timesForPace: Record<string, Time> | null;
  splits: SplitsResult | null;
  friendlyGoalTime: string | null;
  distanceLine: string | null;
  customDistanceLabel: string | null;
  predictionRows: SummaryPredictionRow[];
  intervalRows: IntervalRow[];
  splitsByKilometers: SplitsResult | null;
  splitsByMiles: SplitsResult | null;
  splitsBy100m: SplitsResult | null;
  totalDistanceMeters: number | null;
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
  friendlyGoalTime: null,
  distanceLine: null,
  customDistanceLabel: null,
  predictionRows: [],
  intervalRows: [],
  splitsByKilometers: null,
  splitsByMiles: null,
  splitsBy100m: null,
  totalDistanceMeters: null,
});
