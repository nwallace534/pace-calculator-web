import { ComputeMode, getCalculationUpdate } from "@/utils/calculator";
import { DistanceUnit } from "pace-calculator";
import { StateCreator } from "zustand";
import { CalculatorStore } from "./useCalculatorStore";
import { track, trackOnce } from "@/utils/analytics";
import { AnalyticsEvent } from "@/utils/analytics-events";

const THEME_STORAGE_KEY = "theme";

export type TimesForPaceTab = "times" | "predictions";

// Stored choice wins, then OS preference, then light. We don't subscribe to
// live OS changes — mid-workout theme flips are unwelcome.
const resolveInitialTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage?.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

export interface CalculatorSlice {
  theme: "light" | "dark";
  computeMode: ComputeMode;
  toggleTheme: () => void;
  showSplits: boolean;
  setShowSplits: (showSplits: boolean) => void;
  showTimesForPace: boolean;
  setShowTimesForPace: (showTimesForPace: boolean) => void;
  timesForPaceTab: TimesForPaceTab;
  setTimesForPaceTab: (timesForPaceTab: TimesForPaceTab) => void;
  /** Unit for the splits table; `null` follows the entered distance unit. */
  splitsUnit: DistanceUnit | null;
  toggleSplitsUnit: () => void;
  summaryViewOpen: boolean;
  /** True when the summary was opened by landing on a shared link — drives
   *  the "close the card to use the calculator" hint in the chrome. */
  summaryArrivedFromShare: boolean;
  /** Remembers the user's splits-panel choice while the summary is open,
   *  so closing the summary restores it. The summary always forces splits
   *  on to render its splits table; without this, a user who closed splits
   *  before opening the summary would see them re-opened after closing it. */
  showSplitsBeforeSummary: boolean | null;
  openSummaryView: () => void;
  /** Same as openSummaryView but flags the visit as a share-link landing
   *  so the recipient gets the orientation hint. */
  openSummaryViewFromShare: () => void;
  closeSummaryView: () => void;
}

export const createCalculatorSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  CalculatorSlice
> = (set, get): CalculatorSlice => ({
  theme: resolveInitialTheme(),
  computeMode: ComputeMode.Pace,
  showSplits: false,
  showTimesForPace: false,
  timesForPaceTab: "times",
  splitsUnit: null,
  summaryViewOpen: false,
  summaryArrivedFromShare: false,
  showSplitsBeforeSummary: null,
  openSummaryView: () => {
    const wasOpen = get().summaryViewOpen;
    if (!wasOpen) {
      trackOnce(AnalyticsEvent.SummaryViewOpened);
    }
    // Force showSplits so the splits table is ready to render in the summary
    // card. Without this, the view shows an empty splits section the first
    // time it's opened. Remember the prior choice so closeSummaryView can
    // restore it instead of leaving the calculator's splits panel open.
    const calculationUpdate = getCalculationUpdate({
      ...get(),
      showSplits: true,
    });
    set({
      summaryViewOpen: true,
      summaryArrivedFromShare: false,
      showSplitsBeforeSummary: wasOpen
        ? get().showSplitsBeforeSummary
        : get().showSplits,
      showSplits: true,
      ...calculationUpdate,
    });
  },
  openSummaryViewFromShare: () => {
    const wasOpen = get().summaryViewOpen;
    if (!wasOpen) {
      trackOnce(AnalyticsEvent.SummaryViewOpened);
    }
    const calculationUpdate = getCalculationUpdate({
      ...get(),
      showSplits: true,
    });
    set({
      summaryViewOpen: true,
      summaryArrivedFromShare: true,
      showSplitsBeforeSummary: wasOpen
        ? get().showSplitsBeforeSummary
        : get().showSplits,
      showSplits: true,
      ...calculationUpdate,
    });
  },
  closeSummaryView: () => {
    const prior = get().showSplitsBeforeSummary;
    if (prior === null) {
      set({ summaryViewOpen: false, summaryArrivedFromShare: false });
      return;
    }
    const calculationUpdate = getCalculationUpdate({
      ...get(),
      showSplits: prior,
    });
    set({
      summaryViewOpen: false,
      summaryArrivedFromShare: false,
      showSplits: prior,
      showSplitsBeforeSummary: null,
      ...calculationUpdate,
    });
  },
  setShowSplits: (showSplits) => {
    const calculationUpdate = getCalculationUpdate({
      ...get(),
      showSplits,
    });

    if (showSplits && !get().showSplits) {
      trackOnce(AnalyticsEvent.SplitsOpened);
    }

    set({ showSplits, ...calculationUpdate });
  },
  setShowTimesForPace: (showTimesForPace) => {
    const calculationUpdate = getCalculationUpdate({
      ...get(),
      showTimesForPace,
    });

    if (showTimesForPace && !get().showTimesForPace) {
      trackOnce(AnalyticsEvent.TimesForPaceOpened);
    }

    set({ showTimesForPace, ...calculationUpdate });
  },

  setTimesForPaceTab: (timesForPaceTab) => {
    set({ timesForPaceTab });
  },

  toggleSplitsUnit: () => {
    const current = get().splitsUnit ?? get().distanceUnit;
    const splitsUnit =
      current === DistanceUnit.Kilometers
        ? DistanceUnit.Miles
        : DistanceUnit.Kilometers;

    const calculationUpdate = getCalculationUpdate({
      ...get(),
      splitsUnit,
    });

    track(AnalyticsEvent.SplitsUnitToggled, { to: splitsUnit });
    set({ splitsUnit, ...calculationUpdate });
  },

  toggleTheme: () => {
    const theme = get().theme === "light" ? "dark" : "light";
    track(AnalyticsEvent.ThemeToggled, { to: theme });
    try {
      window.localStorage?.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage can throw (private mode); in-memory state still flips.
    }
    set({ theme });
  },
});
