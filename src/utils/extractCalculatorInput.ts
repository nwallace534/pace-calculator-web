import { CalculatorStore } from "@/state/useCalculatorStore";
import { CalculatorInputSubset } from "@/types/calculatorInput";

export const extractCalculatorInput = (
  state: CalculatorStore,
): CalculatorInputSubset => ({
  distanceWhole: state.distanceWhole,
  distanceFractional: state.distanceFractional,
  distanceUnit: state.distanceUnit,
  timeHours: state.timeHours,
  timeMinutes: state.timeMinutes,
  timeSeconds: state.timeSeconds,
  timeHundredths: state.timeHundredths,
  showSplits: state.showSplits,
  showTimesForPace: state.showTimesForPace,
  computeMode: state.computeMode,
  splitsUnit: state.splitsUnit,
  event: state.event,
  savedDistances: state.savedDistances,
});

export const extractDistanceInput = (state: CalculatorStore) => ({
  distanceWhole: state.distanceWhole,
  distanceFractional: state.distanceFractional,
  distanceUnit: state.distanceUnit,
});
