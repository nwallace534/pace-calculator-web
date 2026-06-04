import { StateCreator } from "zustand";
import { CalculatorStore } from "./useCalculatorStore";
import { DistanceUnit } from "pace-calculator";

export interface PaceSlice {
  paceHours: string;
  paceMinutes: string;
  paceSeconds: string;
  paceHundredths: string;
  paceUnit: DistanceUnit;
  setPaceHours: (hours: string) => void;
  setPaceMinutes: (minutes: string) => void;
  setPaceSeconds: (seconds: string) => void;
  setPaceHundredths: (hundredths: string) => void;
  setPaceUnit: (distanceUnit: DistanceUnit) => void;
}

export const createPaceSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  PaceSlice
> = (set): PaceSlice => ({
  paceHours: "",
  paceMinutes: "",
  paceSeconds: "",
  paceHundredths: "",
  paceUnit: DistanceUnit.Kilometers,
  setPaceHours: (paceHours: string) => set(() => ({ paceHours })),
  setPaceMinutes: (paceMinutes: string) => set(() => ({ paceMinutes })),
  setPaceSeconds: (paceSeconds: string) => set(() => ({ paceSeconds })),
  setPaceHundredths: (paceHundredths: string) =>
    set(() => ({ paceHundredths })),
  setPaceUnit: (paceUnit: DistanceUnit) => set(() => ({ paceUnit })),
});
