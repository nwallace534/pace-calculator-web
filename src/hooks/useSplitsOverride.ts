import { useState } from "react";
import { DistanceUnit } from "pace-calculator";
import type { SplitsResult } from "@/utils/calculator";
import useCalculatorStore from "@/state/useCalculatorStore";

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

// Local to the card — closing discards the choice so nothing leaks into the store.
export function useSplitsOverride(): SplitsOverride {
  const [override, setOverride] = useState<SplitsOverrideTarget>(null);

  const splits = useCalculatorStore((s) => {
    if (override === "K") return s.splitsByKilometers;
    if (override === "miles") return s.splitsByMiles;
    if (override === "100m") return s.splitsBy100m;
    return s.splits;
  });
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
  override: SplitsOverrideTarget;
  totalDistanceMeters: number | null;
  distanceUnit: DistanceUnit;
}): NextSplitsAction {
  if (!splits || totalDistanceMeters === null) return null;
  if (distanceUnit === DistanceUnit.Meters) {
    if (totalDistanceMeters >= 1000) {
      if (override === null) return { setTo: "K", label: "K" };
      if (override === "K") return { setTo: null, label: "laps" };
      return null;
    }
    if (totalDistanceMeters > 400 && totalDistanceMeters <= 800) {
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
}
