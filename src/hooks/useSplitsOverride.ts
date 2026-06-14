import { useCallback, useMemo, useState } from "react";
import {
  calculateSplits,
  DistanceUnit,
  getDistanceInAllUnits,
  Time,
} from "pace-calculator";
import type { SplitsResult } from "@/utils/calculator";
import { getDecimalValue, getNumericValue } from "@/utils/input";

export type SplitsOverrideTarget = "K" | "miles" | "100m" | null;

export type NextSplitsAction = {
  setTo: SplitsOverrideTarget;
  label: string;
} | null;

export type SplitsOverride = {
  /** Override if set, otherwise the store-computed splits. */
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

// Local to the card — closing discards the choice so nothing leaks into the store.
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

  // 100m above 800m would balloon the row count (30+ on a 3km card), and
  // below 400m the defaults are already 100m landmarks — both skip the toggle.
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
