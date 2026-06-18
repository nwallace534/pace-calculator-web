import { DistanceUnit } from "pace-calculator";
import type { SplitsResult } from "@/utils/calculator";
import type { PaceResultsSlice } from "@/state/paceResultsSlice";

// Each option owns its splits selector and full i18n key so the picker
// runs on option references, never string comparisons.

// "laps" means the event's default landmark layout — track laps for ≥400m,
// 100m segments for sprints.
export type SplitsOverrideOptionKey = "K" | "miles" | "hundredMeters" | "laps";

export type SplitsOverrideOption = {
  key: SplitsOverrideOptionKey;
  pickSplits: (state: PaceResultsSlice) => SplitsResult | null;
  i18nKey: string;
};

export const SplitsOverrideOptions = {
  laps: {
    key: "laps",
    pickSplits: (s: PaceResultsSlice) => s.splits,
    i18nKey: "calculator:result.splitsView.laps",
  },
  hundredMeters: {
    key: "hundredMeters",
    pickSplits: (s: PaceResultsSlice) => s.splitsBy100m,
    i18nKey: "calculator:result.splitsView.hundredMeters",
  },
  K: {
    key: "K",
    pickSplits: (s: PaceResultsSlice) => s.splitsByKilometers,
    i18nKey: "calculator:result.splitsView.K",
  },
  miles: {
    key: "miles",
    pickSplits: (s: PaceResultsSlice) => s.splitsByMiles,
    i18nKey: "calculator:result.splitsView.miles",
  },
} as const satisfies Record<SplitsOverrideOptionKey, SplitsOverrideOption>;

// Road units first since they're the common case.
export const SPLITS_OVERRIDE_OPTION_ORDER: SplitsOverrideOption[] = [
  SplitsOverrideOptions.K,
  SplitsOverrideOptions.miles,
  SplitsOverrideOptions.laps,
  SplitsOverrideOptions.hundredMeters,
];

const ONE_MILE_METERS = 1609.344;

// primarySplitsUnit discriminates track-style from road events: Meters means
// laps apply; K/Miles means "laps" would duplicate K/Miles splits.
export const getSplitsOptionDisabledReasonKey = (
  option: SplitsOverrideOption,
  totalDistanceMeters: number | null,
  primarySplitsUnit: DistanceUnit | undefined,
): string | null => {
  if (totalDistanceMeters === null) return null;
  switch (option.key) {
    case "laps":
      if (totalDistanceMeters <= 400)
        return "calculator:result.splitsDisabled.lapsSprint";
      if (totalDistanceMeters > 5000)
        return "calculator:result.splitsDisabled.lapsLong";
      if (primarySplitsUnit !== DistanceUnit.Meters)
        return "calculator:result.splitsDisabled.lapsRoad";
      return null;
    case "hundredMeters":
      if (totalDistanceMeters > 800)
        return "calculator:result.splitsDisabled.hundredMeters";
      return null;
    case "K":
      if (totalDistanceMeters < 1000)
        return "calculator:result.splitsDisabled.K";
      return null;
    case "miles":
      if (totalDistanceMeters < ONE_MILE_METERS)
        return "calculator:result.splitsDisabled.miles";
      return null;
  }
};

// Road events follow the event's own entry unit so marathon (miles-configured)
// opens in miles and 5K/10K (km-configured) open in K.
export const getDefaultSplitsOption = (
  totalDistanceMeters: number | null,
  primarySplitsUnit: DistanceUnit | undefined,
): SplitsOverrideOption => {
  if (totalDistanceMeters === null) return SplitsOverrideOptions.laps;
  if (totalDistanceMeters <= 400) return SplitsOverrideOptions.hundredMeters;
  if (primarySplitsUnit === DistanceUnit.Meters)
    return SplitsOverrideOptions.laps;
  if (primarySplitsUnit === DistanceUnit.Miles)
    return SplitsOverrideOptions.miles;
  return SplitsOverrideOptions.K;
};
