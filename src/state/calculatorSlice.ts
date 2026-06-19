import { ComputeMode } from "@/utils/calculator";
import { StateCreator } from "zustand";
import { CalculatorStore } from "./useCalculatorStore";
import { trackOnce, track } from "@/utils/analytics";
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
  summaryViewOpen: boolean;
  /** True when opened via a share link; drives the orientation hint. */
  summaryArrivedFromShare: boolean;
  openSummaryView: () => void;
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
  summaryViewOpen: false,
  summaryArrivedFromShare: false,
  openSummaryView: () => {
    if (!get().summaryViewOpen) {
      trackOnce(AnalyticsEvent.SummaryViewOpened);
    }
    set({ summaryViewOpen: true, summaryArrivedFromShare: false });
  },
  openSummaryViewFromShare: () => {
    if (!get().summaryViewOpen) {
      trackOnce(AnalyticsEvent.SummaryViewOpened);
    }
    set({ summaryViewOpen: true, summaryArrivedFromShare: true });
  },
  closeSummaryView: () => {
    set({ summaryViewOpen: false, summaryArrivedFromShare: false });
  },
  setShowSplits: (showSplits) => {
    if (showSplits && !get().showSplits) {
      trackOnce(AnalyticsEvent.SplitsOpened);
    }
    set({ showSplits });
  },
  setShowTimesForPace: (showTimesForPace) => {
    if (showTimesForPace && !get().showTimesForPace) {
      trackOnce(AnalyticsEvent.TimesForPaceOpened);
    }
    set({ showTimesForPace });
  },

  setTimesForPaceTab: (timesForPaceTab) => {
    set({ timesForPaceTab });
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
