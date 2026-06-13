import { useCallback, useMemo, useState } from "react";
import {
  calculateSplits,
  DistanceUnit,
  getDistanceInAllUnits,
  Time,
} from "pace-calculator";
import type { SplitsResult } from "@/utils/calculator";
import { getDecimalValue, getNumericValue } from "@/utils/input";

// Local splits-display override for the summary card — does NOT touch the
// store. Closing the card discards the choice. The "Show in X" button cycles
// through one alternative at a time; `nextAction` describes what that button
// should do for the current event/distance, or `null` when there's nothing
// useful to toggle to.
export type SplitsOverrideTarget = "K" | "miles" | "100m" | null;

export type NextSplitsAction = {
  setTo: SplitsOverrideTarget;
  label: string;
} | null;

export type SplitsOverride = {
  /** Merged splits: override if set, otherwise the store-computed splits. */
  splits: SplitsResult | null;
  setOverride: (next: SplitsOverrideTarget) => void;
  nextAction: NextSplitsAction;
};

type Params = {
  storeSplits: SplitsResult | null;
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  timeHundredths: string;
};

export function useSplitsOverride({
  storeSplits,
  distanceWhole,
  distanceFractional,
  distanceUnit,
  timeHours,
  timeMinutes,
  timeSeconds,
  timeHundredths,
}: Params): SplitsOverride {
  const [override, setOverride] = useState<SplitsOverrideTarget>(null);

  const distanceAll = useMemo(
    () =>
      getDistanceInAllUnits({
        distanceValue:
          getNumericValue(distanceWhole) + getDecimalValue(distanceFractional),
        distanceUnit,
      }),
    [distanceWhole, distanceFractional, distanceUnit],
  );

  const overrideResult: SplitsResult | null = useMemo(() => {
    if (override === null) return null;
    const inputTime: Time = {
      hours: getNumericValue(timeHours),
      minutes: getNumericValue(timeMinutes),
      seconds: getNumericValue(timeSeconds),
      milliseconds: getNumericValue(timeHundredths) * 10,
    };
    if (override === "K") {
      return {
        unit: DistanceUnit.Kilometers,
        showHundredths: false,
        trackSummary: null,
        rows: calculateSplits({
          time: inputTime,
          distance: distanceAll.inKilometers,
          splitInterval: 1,
        }),
      };
    }
    if (override === "miles") {
      return {
        unit: DistanceUnit.Miles,
        showHundredths: false,
        trackSummary: null,
        rows: calculateSplits({
          time: inputTime,
          distance: distanceAll.inMiles,
          splitInterval: 1,
        }),
      };
    }
    // 100m
    return {
      unit: DistanceUnit.Meters,
      showHundredths: false,
      trackSummary: null,
      rows: calculateSplits({
        time: inputTime,
        distance: distanceAll.inMeters,
        splitInterval: 100,
      }),
    };
  }, [
    override,
    distanceAll,
    timeHours,
    timeMinutes,
    timeSeconds,
    timeHundredths,
  ]);

  const splits = overrideResult ?? storeSplits;

  // Single-button cycle, matching the main splits panel pattern. For road
  // events it flips between km and miles. For meter events it cycles
  // landmarks ↔ K (≥ 1km) or landmarks ↔ 100m (400m < total ≤ 800m); below
  // 400m the default splits are already 100m landmarks, above 800m the 100m
  // row count gets unwieldy, so neither shows a toggle.
  const nextAction: NextSplitsAction = useMemo(() => {
    if (!splits) return null;
    const totalMeters = distanceAll.inMeters.distanceValue;
    const isMetersEvent = distanceUnit === DistanceUnit.Meters;
    if (isMetersEvent) {
      if (totalMeters >= 1000) {
        if (override === null) return { setTo: "K", label: "K" };
        if (override === "K") return { setTo: null, label: "laps" };
        return null;
      }
      if (totalMeters > 400 && totalMeters <= 800) {
        if (override === null) return { setTo: "100m", label: "100m" };
        if (override === "100m") return { setTo: null, label: "laps" };
        return null;
      }
      return null;
    }
    if (splits.unit === DistanceUnit.Kilometers) {
      return { setTo: "miles", label: "miles" };
    }
    if (splits.unit === DistanceUnit.Miles) {
      return { setTo: "K", label: "K" };
    }
    return null;
  }, [splits, override, distanceAll, distanceUnit]);

  const setOverrideStable = useCallback(
    (next: SplitsOverrideTarget) => setOverride(next),
    [],
  );

  return { splits, setOverride: setOverrideStable, nextAction };
}
