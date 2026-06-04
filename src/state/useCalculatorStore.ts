import { create } from "zustand";
import { createTimeSlice, TimeSlice } from "./timeSlice";
import { createDistanceSlice, DistanceSlice } from "./distanceSlice";
import { createCalculatorSlice, CalculatorSlice } from "./calculatorSlice";
import { createPaceSlice, PaceSlice } from "./paceSlice";
import { createPaceResultsSlice, PaceResultsSlice } from "./paceResultsSlice";
import {
  createDistanceResultsSlice,
  DistanceResultsSlice,
} from "./distanceResultsSlice";
import { createSpinnerHintSlice, SpinnerHintSlice } from "./spinnerHintSlice";

export type CalculatorStore = CalculatorSlice &
  DistanceSlice &
  TimeSlice &
  DistanceSlice &
  PaceSlice &
  PaceResultsSlice &
  DistanceResultsSlice &
  SpinnerHintSlice;

const useCalculatorStore = create<CalculatorStore>()((...args) => ({
  ...createCalculatorSlice(...args),
  ...createTimeSlice(...args),
  ...createDistanceSlice(...args),
  ...createPaceSlice(...args),
  ...createPaceResultsSlice(...args),
  ...createDistanceResultsSlice(...args),
  ...createSpinnerHintSlice(...args),
}));

// Resolve the default event for first load
useCalculatorStore.getState().setEvent(useCalculatorStore.getState().event);

export default useCalculatorStore;
