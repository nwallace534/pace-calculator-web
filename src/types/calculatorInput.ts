import { ComputeMode } from "@/utils/calculator";
import { DistanceUnit } from "pace-calculator";

export interface CalculatorInputSubset {
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  timeHundredths: string;
  showSplits: boolean;
  showTimesForPace: boolean;
  computeMode: ComputeMode;
  splitsUnit: DistanceUnit | null;
  event: string;
}

export interface DistanceInputSubset {
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
}
