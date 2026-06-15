import type { SplitsResult } from "@/utils/calculator";
import type { PaceResultsSlice } from "@/state/paceResultsSlice";

// Centralised options for the "show splits in different unit" toggle that
// appears on both the summary card (useSplitsOverride) and the main pace
// splits panel (PaceSplits). Each option owns its splits selector and its
// full i18n key so the hook's logic runs entirely on option references —
// no string comparisons against override values, no template + interpolated
// unit fragment (that older shape broke for languages with case marking or
// different word order).

// "laps" isn't a unit — it's "show the event's default landmark layout"
// (used by track events that branch from sub-800m laps into 100m / from
// >=1km into K splits). Picking it just returns the store's natural splits.
export type SplitsOverrideOption = {
  pickSplits: (state: PaceResultsSlice) => SplitsResult | null;
  i18nKey: string;
};

export const SplitsOverrideOptions = {
  K: {
    pickSplits: (s: PaceResultsSlice) => s.splitsByKilometers,
    i18nKey: "calculator:result.splitsInK",
  },
  miles: {
    pickSplits: (s: PaceResultsSlice) => s.splitsByMiles,
    i18nKey: "calculator:result.splitsInMiles",
  },
  hundredMeters: {
    pickSplits: (s: PaceResultsSlice) => s.splitsBy100m,
    i18nKey: "calculator:result.splitsInHundredMeters",
  },
  laps: {
    pickSplits: (s: PaceResultsSlice) => s.splits,
    i18nKey: "calculator:result.splitsInLaps",
  },
} as const satisfies Record<string, SplitsOverrideOption>;
