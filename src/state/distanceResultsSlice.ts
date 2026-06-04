import { StateCreator } from "zustand";
import { DistanceInAllUnits } from "pace-calculator";

export interface DistanceResultsSlice {
  allDistances: DistanceInAllUnits | null;
}

export const createDistanceResultsSlice: StateCreator<
  DistanceResultsSlice,
  [],
  [],
  DistanceResultsSlice
> = (): DistanceResultsSlice => ({
  allDistances: null,
});
