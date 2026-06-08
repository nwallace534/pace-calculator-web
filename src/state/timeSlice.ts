import { getCalculationUpdate } from "@/utils/calculator";
import { sanitizeTime, sanitizeTimeField, TimeField } from "@/utils/input";
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
  const createTimeSetter = (field: TimeField) => {
    return (value: string) => {
      const validated = sanitizeTimeField(field, value);

      const calculationUpdate = getCalculationUpdate({
        ...extractCalculatorInput(get()),
        [field]: validated,
      });

      // Once per session, with which field — answers "do visitors type
      // into the time inputs at all?" without per-keystroke noise.
      trackOnce(AnalyticsEvent.TimeFieldEdited, { field });
      set({
        [field]: validated,
        ...calculationUpdate,
      });
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

    setTimeHours: createTimeSetter("timeHours"),
    setTimeMinutes: createTimeSetter("timeMinutes"),
    setTimeSeconds: createTimeSetter("timeSeconds"),
    setTimeHundredths: createTimeSetter("timeHundredths"),

    setFullTime: (
      hours: string,
      minutes: string,
      seconds: string,
      hundredths: string,
    ) => {
      const validated = sanitizeTime({
        timeHours: hours,
        timeMinutes: minutes,
        timeSeconds: seconds,
        timeHundredths: hundredths,
      });

      const calculationUpdate = getCalculationUpdate({
        ...extractCalculatorInput(get()),
        ...validated,
      });

      set({
        ...validated,
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
