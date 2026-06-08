import { StateCreator } from "zustand";
import { CalculatorStore } from "./useCalculatorStore";
import { DistanceUnit } from "pace-calculator";
import { DistanceMode } from "@/types/distance";
import { sanitizeDistanceField } from "@/utils/input";
import {
  getCalculationUpdate,
  getDistanceConversionUpdates,
} from "@/utils/calculator";
import {
  DEFAULT_EVENT_ID,
  Events,
  getDistanceDetailsFromEvent,
  sanitizeTimeForEvent,
} from "@/utils/events";
import {
  extractCalculatorInput,
  extractDistanceInput,
} from "@/utils/extractCalculatorInput";
import { hasMeaningfulTime } from "@/utils/time";
import { track, trackOnce } from "@/utils/analytics";
import { AnalyticsEvent } from "@/utils/analytics-events";

export interface DistanceSlice {
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
  event: string;
  eventTimes: Record<
    string,
    {
      timeHours: string;
      timeMinutes: string;
      timeSeconds: string;
      timeHundredths: string;
    }
  >;
  customDistance: {
    distanceWhole: string;
    distanceFractional: string;
    distanceUnit: DistanceUnit;
  } | null;
  /** Kept separate from `customDistance` so the two modes don't trample each
   *  other's values. */
  customTrackDistance: {
    distanceWhole: string;
    distanceFractional: string;
    distanceUnit: DistanceUnit;
  } | null;
  setDistanceWhole: (distance: string) => void;
  setDistanceFractional: (distanceDecimal: string) => void;
  setDistanceUnit: (distanceUnit: DistanceUnit) => void;
  setEvent: (event: string) => void;
}

const getRememberedCustomDistance = (
  event: string,
  customDistance: DistanceSlice["customDistance"],
  customTrackDistance: DistanceSlice["customTrackDistance"],
) => {
  if (event === DistanceMode.Custom) return customDistance;
  if (event === DistanceMode.CustomTrack) return customTrackDistance;
  return null;
};

export const createDistanceSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  DistanceSlice
> = (set, get): DistanceSlice => {
  return {
    distanceWhole: "",
    distanceFractional: "",
    distanceUnit: DistanceUnit.Kilometers,
    event: DEFAULT_EVENT_ID,
    eventTimes: {},
    customDistance: null,
    customTrackDistance: null,
    setDistanceWhole: (distanceWhole: string) => {
      const validatedDistanceWhole = sanitizeDistanceField(
        "distanceWhole",
        distanceWhole,
      );

      const calculationUpdate = getCalculationUpdate({
        ...extractCalculatorInput(get()),
        distanceWhole: validatedDistanceWhole,
      });

      const allDistancesUpdate = getDistanceConversionUpdates({
        ...extractDistanceInput(get()),
        distanceWhole: validatedDistanceWhole,
      });

      trackOnce(AnalyticsEvent.DistanceFieldEdited, { field: "whole" });
      set({
        distanceWhole: validatedDistanceWhole,
        ...calculationUpdate,
        ...allDistancesUpdate,
      });
    },
    setDistanceFractional: (distanceFractional: string) => {
      const validatedDistanceFractional = sanitizeDistanceField(
        "distanceFractional",
        distanceFractional,
      );

      const calculationUpdate = getCalculationUpdate({
        ...extractCalculatorInput(get()),
        distanceFractional: validatedDistanceFractional,
      });

      const allDistancesUpdate = getDistanceConversionUpdates({
        ...extractDistanceInput(get()),
        distanceFractional: validatedDistanceFractional,
      });

      trackOnce(AnalyticsEvent.DistanceFieldEdited, { field: "fractional" });
      set({
        distanceFractional: validatedDistanceFractional,
        ...calculationUpdate,
        ...allDistancesUpdate,
      });
    },

    setDistanceUnit: (distanceUnit: DistanceUnit) => {
      const calculationUpdate = getCalculationUpdate({
        ...extractCalculatorInput(get()),
        distanceUnit,
      });
      const allDistancesUpdate = getDistanceConversionUpdates({
        ...extractDistanceInput(get()),
        distanceUnit,
      });
      if (distanceUnit !== get().distanceUnit) {
        track(AnalyticsEvent.DistanceUnitChanged, { to: distanceUnit });
      }
      set({
        distanceUnit,
        ...calculationUpdate,
        ...allDistancesUpdate,
      });
    },

    setEvent: (newEvent: string) => {
      const {
        event: currentEvent,
        timeHours,
        timeMinutes,
        timeSeconds,
        timeHundredths,
      } = get();

      // The store bootstraps by calling setEvent with the existing event; only
      // count a real change as a user choice.
      if (newEvent !== currentEvent) {
        track(AnalyticsEvent.EventSelected, {
          to: newEvent,
          from: currentEvent,
        });
      }
      const { distanceWhole, distanceFractional, distanceUnit } = get();
      const eventTimes = { ...get().eventTimes };

      const currentTime = {
        timeHours,
        timeMinutes,
        timeSeconds,
        timeHundredths,
      };

      // Remember the time being left behind so it can be restored on return.
      if (currentEvent && hasMeaningfulTime(currentTime)) {
        eventTimes[currentEvent] = currentTime;
      }

      // Custom variants have no preset — remember the distance per-mode so
      // flipping between Custom and Custom Track doesn't trample either value.
      const leavingDistance = {
        distanceWhole,
        distanceFractional,
        distanceUnit,
      };
      const customDistance =
        currentEvent === DistanceMode.Custom
          ? leavingDistance
          : get().customDistance;
      const customTrackDistance =
        currentEvent === DistanceMode.CustomTrack
          ? leavingDistance
          : get().customTrackDistance;

      const eventDetails = Events.find(
        (eventOption) => eventOption.id === newEvent,
      );

      // Restore saved time, fall back to event preset, or zero for Custom.
      // Sanitised against the new event's visible fields — see events.ts.
      const savedTime = sanitizeTimeForEvent(
        eventTimes[newEvent] ||
          eventDetails?.defaultTime || {
            timeHours: "0",
            timeMinutes: "0",
            timeSeconds: "0",
            timeHundredths: "00",
          },
        newEvent,
      );

      // Preset events take their catalog distance. Custom variants restore
      // the remembered value, or start blank. Track Custom blanks in meters,
      // road Custom keeps whatever unit the user was last in.
      const distanceDetails = getDistanceDetailsFromEvent(newEvent);
      const rememberedCustomDistance = getRememberedCustomDistance(
        newEvent,
        customDistance,
        customTrackDistance,
      );
      const blankCustomUnit =
        newEvent === DistanceMode.CustomTrack
          ? DistanceUnit.Meters
          : distanceUnit;
      const customDistanceOrBlank = rememberedCustomDistance ?? {
        distanceWhole: "",
        distanceFractional: "",
        distanceUnit: blankCustomUnit,
      };
      const newDistanceWhole =
        distanceDetails?.distance ?? customDistanceOrBlank.distanceWhole;
      const newDistanceFractional =
        distanceDetails?.distanceDecimal ??
        customDistanceOrBlank.distanceFractional;
      const resolvedDistanceUnit =
        distanceDetails?.distanceUnit ?? customDistanceOrBlank.distanceUnit;
      // Road Custom is km/mi only — snap meters (e.g. from a pre-guardrail
      // session) back to km so the dropdown can render the value.
      const newDistanceUnit =
        newEvent === DistanceMode.Custom &&
        resolvedDistanceUnit === DistanceUnit.Meters
          ? DistanceUnit.Kilometers
          : resolvedDistanceUnit;

      const calculationUpdate = getCalculationUpdate({
        ...extractCalculatorInput(get()),
        // Override event — the calculator picks split configs by it, so
        // without this splits would compute against the event being left.
        event: newEvent,
        timeHours: savedTime.timeHours,
        timeMinutes: savedTime.timeMinutes,
        timeSeconds: savedTime.timeSeconds,
        timeHundredths: savedTime.timeHundredths,
        distanceWhole: newDistanceWhole,
        distanceFractional: newDistanceFractional,
        distanceUnit: newDistanceUnit,
      });

      const allDistancesUpdate = getDistanceConversionUpdates({
        distanceWhole: newDistanceWhole,
        distanceFractional: newDistanceFractional,
        distanceUnit: newDistanceUnit,
      });

      set({
        event: newEvent,
        eventTimes,
        customDistance,
        customTrackDistance,
        timeHours: savedTime.timeHours,
        timeMinutes: savedTime.timeMinutes,
        timeSeconds: savedTime.timeSeconds,
        timeHundredths: savedTime.timeHundredths,
        distanceWhole: newDistanceWhole,
        distanceFractional: newDistanceFractional,
        distanceUnit: newDistanceUnit,
        ...calculationUpdate,
        ...allDistancesUpdate,
      });
    },
  };
};
