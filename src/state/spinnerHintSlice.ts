import { StateCreator } from "zustand";
import { CalculatorStore } from "./useCalculatorStore";
import { track } from "@/utils/analytics";
import { AnalyticsEvent } from "@/utils/analytics-events";

// Hint fires when the user racks up RAPID_TAP_THRESHOLD taps inside the
// rolling window. Slow tapping lets old taps age out, so the count self-resets.
const RAPID_TAP_THRESHOLD = 15;
const RAPID_TAP_WINDOW_MS = 10000;

const STORAGE_KEY = "pace-calculator:spinner-hint-seen";

// localStorage can throw (private mode, quota); failing to remember the hint
// is harmless but must never break the calculator.
const loadSeen = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const saveSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // ignore
  }
};

export interface SpinnerHintSlice {
  /** Persisted: true once the hint has been shown or the user has held. */
  spinnerHintLearned: boolean;
  /** Record one tap. Returns true if it just crossed the rapid-tap threshold. */
  registerSpinnerTap: () => boolean;
  registerSpinnerHold: () => void;
  /** Test-only — the closure tap window and persisted flag don't reset
   *  between cases otherwise. */
  resetSpinnerHint: () => void;
}

export const createSpinnerHintSlice: StateCreator<
  CalculatorStore,
  [],
  [],
  SpinnerHintSlice
> = (set, get) => {
  // Closure, not reactive state — changes on every tap and nothing renders it.
  let tapTimes: number[] = [];

  const retire = () => {
    set({ spinnerHintLearned: true });
    saveSeen();
  };

  return {
    spinnerHintLearned: loadSeen(),

    registerSpinnerTap: () => {
      if (get().spinnerHintLearned) return false;

      const now = performance.now();
      tapTimes = tapTimes.filter((time) => now - time < RAPID_TAP_WINDOW_MS);
      tapTimes.push(now);

      if (tapTimes.length >= RAPID_TAP_THRESHOLD) {
        tapTimes = [];
        retire();
        track(AnalyticsEvent.SpinnerHintShown);
        return true;
      }
      return false;
    },

    registerSpinnerHold: () => {
      if (get().spinnerHintLearned) return;
      retire();
    },

    resetSpinnerHint: () => {
      tapTimes = [];
      set({ spinnerHintLearned: false });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    },
  };
};
