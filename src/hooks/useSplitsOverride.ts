import { useState } from "react";
import { DistanceUnit } from "pace-calculator";
import type { SplitsResult } from "@/utils/calculator";
import useCalculatorStore from "@/state/useCalculatorStore";
import {
  SplitsOverrideOption,
  SplitsOverrideOptions,
} from "@/utils/splitsOverride";

export type NextSplitsAction = SplitsOverrideOption | null;

export type SplitsOverride = {
  /** Effective splits — pulled by the active option's pickSplits selector. */
  splits: SplitsResult | null;
  setOverride: (next: SplitsOverrideOption) => void;
  nextAction: NextSplitsAction;
};

// Local to the card — closing discards the choice so nothing leaks into the store.
export function useSplitsOverride(): SplitsOverride {
  const [override, setOverride] = useState<SplitsOverrideOption>(
    SplitsOverrideOptions.laps,
  );

  const splits = useCalculatorStore(override.pickSplits);
  const totalDistanceMeters = useCalculatorStore((s) => s.totalDistanceMeters);
  const distanceUnit = useCalculatorStore((s) => s.distanceUnit);

  const nextAction = pickNextAction({
    splits,
    override,
    totalDistanceMeters,
    distanceUnit,
  });

  return { splits, setOverride, nextAction };
}

// 100m above 800m would balloon the row count (30+ on a 3km card), and
// below 400m the defaults are already 100m landmarks — both skip the toggle.
function pickNextAction({
  splits,
  override,
  totalDistanceMeters,
  distanceUnit,
}: {
  splits: SplitsResult | null;
  override: SplitsOverrideOption;
  totalDistanceMeters: number | null;
  distanceUnit: DistanceUnit;
}): NextSplitsAction {
  if (!splits || totalDistanceMeters === null) return null;
  if (distanceUnit === DistanceUnit.Meters) {
    if (totalDistanceMeters >= 1000) {
      if (override === SplitsOverrideOptions.laps)
        return SplitsOverrideOptions.K;
      if (override === SplitsOverrideOptions.K)
        return SplitsOverrideOptions.laps;
      return null;
    }
    if (totalDistanceMeters > 400 && totalDistanceMeters <= 800) {
      if (override === SplitsOverrideOptions.laps)
        return SplitsOverrideOptions.hundredMeters;
      if (override === SplitsOverrideOptions.hundredMeters)
        return SplitsOverrideOptions.laps;
      return null;
    }
    return null;
  }
  if (splits.unit === DistanceUnit.Kilometers)
    return SplitsOverrideOptions.miles;
  if (splits.unit === DistanceUnit.Miles) return SplitsOverrideOptions.K;
  return null;
}
