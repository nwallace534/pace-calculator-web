import { getCalculationUpdate } from "@/utils/calculator";
import { getValidatedInput } from "@/utils/input";
import { StateCreator } from "zustand";
import { CalculatorStore } from "./useCalculatorStore";
import { applyTimeStep } from "@/utils/time";
import { extractCalculatorInput } from "@/utils/extractCalculatorInput";
import {
  DEFAULT_EVENT_ID,
  Events,
  getMaxTimeMs,
  getStepMs,
  sanitizeTimeForEvent,
} from "@/utils/events";
import { trackOnce } from "@/utils/analytics";
import { AnalyticsEvent } from "@/utils/analytics-events";

export interface TimeSlice {
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  timeHundredths: string;
  setTimeHours: (hours: string) => void;
  setTimeMinutes: (minutes: string) => void;
  setTimeSeconds: (seconds: string) => void;
  setTimeHundredths: (hundredths: string) => void;
  setFullTime: (
    hours: string,
    minutes: string,
    seconds: string,
    hundredths: string,
  ) => void;
  incrementTime: (steps: number) => void;
}
export const createTimeSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  TimeSlice
> = (set, get): TimeSlice => {
  const createTimeSetter = (
    field: "timeHours" | "timeMinutes" | "timeSeconds" | "timeHundredths",
    maxNumber: number,
    padZeroLength: number,
  ) => {
    return (value: string) => {
      const validated = getValidatedInput(value, maxNumber, padZeroLength);

      const calculationUpdate = getCalculationUpdate({
        ...extractCalculatorInput(get()),
        [field]: validated,
      });

      // Once per session, with which field — answers "do visitors type
      // into the time inputs at all?" without per-keystroke noise.
      trackOnce(AnalyticsEvent.TimeFieldEdited, { field });
      set({ [field]: validated, ...calculationUpdate });
    };
  };

  // On first page load, use the default event's preset time as the starting
  // value, zeroing out any fields that event doesn't show. The numbers live
  // in events.ts — change them there and the first-load time follows.
  const defaultEvent = Events.find((e) => e.id === DEFAULT_EVENT_ID);
  const initialTime = sanitizeTimeForEvent(
    defaultEvent?.defaultTime ?? {
      timeHours: "0",
      timeMinutes: "0",
      timeSeconds: "0",
      timeHundredths: "00",
    },
    DEFAULT_EVENT_ID,
  );

  return {
    ...initialTime,

    setTimeHours: createTimeSetter("timeHours", 99, 2),
    setTimeMinutes: createTimeSetter("timeMinutes", 59, 2),
    setTimeSeconds: createTimeSetter("timeSeconds", 59, 2),
    setTimeHundredths: createTimeSetter("timeHundredths", 99, 2),

    setFullTime: (
      hours: string,
      minutes: string,
      seconds: string,
      hundredths: string,
    ) => {
      const validatedHours = getValidatedInput(hours, 99, 2);
      const validatedMinutes = getValidatedInput(minutes, 59, 2);
      const validatedSeconds = getValidatedInput(seconds, 59, 2);
      const validatedHundredths = getValidatedInput(hundredths, 99, 2);

      const calculationUpdate = getCalculationUpdate({
        ...extractCalculatorInput(get()),
        timeHours: validatedHours,
        timeMinutes: validatedMinutes,
        timeSeconds: validatedSeconds,
        timeHundredths: validatedHundredths,
      });

      set({
        timeHours: validatedHours,
        timeMinutes: validatedMinutes,
        timeSeconds: validatedSeconds,
        timeHundredths: validatedHundredths,
        ...calculationUpdate,
      });
    },

    incrementTime: (steps) => {
      const event = get().event;
      const updatedTime = applyTimeStep({
        currentTime: {
          timeHours: get().timeHours,
          timeMinutes: get().timeMinutes,
          timeSeconds: get().timeSeconds,
          timeHundredths: get().timeHundredths,
        },
        steps,
        stepMs: getStepMs(event),
        maxMs: getMaxTimeMs(event),
      });

      const calculationUpdate = getCalculationUpdate({
        ...extractCalculatorInput(get()),
        ...updatedTime,
      });

      set({ ...updatedTime, ...calculationUpdate });
    },
  };
};
