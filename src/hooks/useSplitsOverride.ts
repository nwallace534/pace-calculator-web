import type { SplitsResult } from "@/utils/calculator";
import useCalculatorStore from "@/state/useCalculatorStore";
import {
  SplitsOverrideOption,
  SplitsOverrideOptions,
  SPLITS_OVERRIDE_OPTION_ORDER,
  getDefaultSplitsOption,
  getSplitsOptionDisabledReasonKey,
} from "@/utils/splitsOverride";

export type SplitsViewOption = {
  option: SplitsOverrideOption;
  enabled: boolean;
  disabledReasonKey: string | null;
};

export type SplitsOverride = {
  splits: SplitsResult | null;
  /** Saved preference if still valid for the current event, else smart default. */
  selected: SplitsOverrideOption;
  options: SplitsViewOption[];
  /** Persists the user's pick under the current event id. */
  onSelect: (option: SplitsOverrideOption) => void;
};

export function useSplitsOverride(): SplitsOverride {
  const event = useCalculatorStore((s) => s.event);
  const totalDistanceMeters = useCalculatorStore((s) => s.totalDistanceMeters);
  const primarySplitsUnit = useCalculatorStore((s) => s.splits?.unit);
  const savedKey = useCalculatorStore((s) => s.splitsPreferences[event]);
  const setSplitsPreference = useCalculatorStore((s) => s.setSplitsPreference);

  // Saved pick stays put when invalid for the current event — the user gets
  // it back automatically when they return to one where it applies.
  const savedOption = savedKey ? SplitsOverrideOptions[savedKey] : null;
  const savedOptionEnabled =
    savedOption !== null &&
    getSplitsOptionDisabledReasonKey(
      savedOption,
      totalDistanceMeters,
      primarySplitsUnit,
    ) === null;
  const selected = savedOptionEnabled
    ? savedOption
    : getDefaultSplitsOption(totalDistanceMeters, primarySplitsUnit);

  const splits = useCalculatorStore(selected.pickSplits);

  const options: SplitsViewOption[] = SPLITS_OVERRIDE_OPTION_ORDER.map(
    (option) => {
      const disabledReasonKey = getSplitsOptionDisabledReasonKey(
        option,
        totalDistanceMeters,
        primarySplitsUnit,
      );
      return {
        option,
        enabled: disabledReasonKey === null,
        disabledReasonKey,
      };
    },
  );

  const onSelect = (option: SplitsOverrideOption) => {
    setSplitsPreference(event, option.key);
  };

  return { splits, selected, options, onSelect };
}
