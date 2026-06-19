import { useState } from "react";
import type { SplitsResult } from "@/utils/calculator";
import useCalculatorStore from "@/state/useCalculatorStore";
import {
  SplitsViewOption,
  SplitsViewOptionKey,
  SplitsViewOptions,
  SPLITS_VIEW_OPTION_ORDER,
  getDefaultSplitsOption,
  getSplitsOptionDisabledReasonKey,
} from "@/utils/splitsView";

export type SplitsPickerOption = {
  option: SplitsViewOption;
  enabled: boolean;
  disabledReasonKey: string | null;
};

export type SplitsViewSelection = {
  splits: SplitsResult | null;
  selected: SplitsViewOption;
  options: SplitsPickerOption[];
  onSelect: (option: SplitsViewOption) => void;
};

const getEnabledOption = (
  key: SplitsViewOptionKey | null | undefined,
  totalDistanceMeters: number | null,
  primarySplitsUnit: SplitsResult["unit"] | undefined,
): SplitsViewOption | null => {
  if (!key) return null;
  const option = SplitsViewOptions[key];
  if (
    getSplitsOptionDisabledReasonKey(
      option,
      totalDistanceMeters,
      primarySplitsUnit,
    ) !== null
  ) {
    return null;
  }
  return option;
};

const buildOptions = (
  totalDistanceMeters: number | null,
  primarySplitsUnit: SplitsResult["unit"] | undefined,
): SplitsPickerOption[] =>
  SPLITS_VIEW_OPTION_ORDER.map((option) => {
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
  });

export function useSplitsViewSelection(): SplitsViewSelection {
  const event = useCalculatorStore((s) => s.event);
  const totalDistanceMeters = useCalculatorStore((s) => s.totalDistanceMeters);
  const primarySplitsUnit = useCalculatorStore((s) => s.splits?.unit);
  const selectedKey = useCalculatorStore((s) => s.splitsViewSelections[event]);
  const setSplitsViewSelection = useCalculatorStore(
    (s) => s.setSplitsViewSelection,
  );

  const selected =
    getEnabledOption(selectedKey, totalDistanceMeters, primarySplitsUnit) ??
    getDefaultSplitsOption(totalDistanceMeters, primarySplitsUnit);
  const splits = useCalculatorStore(selected.pickSplits);
  const options = buildOptions(totalDistanceMeters, primarySplitsUnit);

  return {
    splits,
    selected,
    options,
    onSelect: (option) => setSplitsViewSelection(event, option.key),
  };
}

export function useSummarySplitsViewSelection(): SplitsViewSelection {
  const totalDistanceMeters = useCalculatorStore((s) => s.totalDistanceMeters);
  const primarySplitsUnit = useCalculatorStore((s) => s.splits?.unit);
  const [selectedKey, setSelectedKey] = useState<SplitsViewOptionKey | null>(
    null,
  );

  const selected =
    getEnabledOption(selectedKey, totalDistanceMeters, primarySplitsUnit) ??
    getDefaultSplitsOption(totalDistanceMeters, primarySplitsUnit);
  const splits = useCalculatorStore(selected.pickSplits);
  const options = buildOptions(totalDistanceMeters, primarySplitsUnit);

  return {
    splits,
    selected,
    options,
    onSelect: (option) => setSelectedKey(option.key),
  };
}
