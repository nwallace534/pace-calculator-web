import { beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import "@/i18n/config";
import useCalculatorStore from "@/state/useCalculatorStore";
import { ComputeMode } from "@/utils/calculator";
import { DEFAULT_EVENT_ID } from "@/utils/events";
import { DistanceUnit } from "pace-calculator";

beforeEach(() => {
  // RTL flips IS_REACT_ACT_ENVIRONMENT on each render. Playwright drives real
  // DOM events outside React's act batches, so we flip it back to silence the
  // spurious "wrap in act(...)" warnings — we assert on the settled DOM.
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = false;

  // Clear the per-test localStorage so a prior test's theme toggle (or any
  // other persisted preference) doesn't bleed into the next render.
  window.localStorage?.removeItem("theme");
  window.localStorage?.removeItem("pace-calculator:saved-distances");
  window.localStorage?.removeItem("pace-calculator:saved-durations");

  // The Zustand store is a module-level singleton; without a full wipe, panel
  // toggles, per-event time memory, the splits-unit override and Custom
  // distance slots all leak between tests. Wipe inline to give each test a
  // clean default-event slate.
  const store = useCalculatorStore;
  store.setState({
    showSplits: false,
    showTimesForPace: false,
    timesForPaceTab: "times",
    splitsUnit: null,
    computeMode: ComputeMode.Pace,
    theme: "light",
    event: DEFAULT_EVENT_ID,
    eventTimes: {},
    customDistance: null,
    customTrackDistance: null,
    distanceWhole: "",
    distanceFractional: "",
    distanceUnit: DistanceUnit.Kilometers,
    timeHours: "",
    timeMinutes: "",
    timeSeconds: "",
    timeHundredths: "",
    paceHours: "",
    paceMinutes: "",
    paceSeconds: "",
    paceHundredths: "",
    savedDistances: [],
    savedDurations: [],
  });
  // Re-bootstrap the default event so distance/time/calculations repaint —
  // same path the store uses on first load.
  store.getState().setEvent(DEFAULT_EVENT_ID);

  // The hint slice carries closure-bound state (the rolling tap window) and a
  // localStorage flag that survive a normal reset by design. Tests need a
  // clean slate, so we wipe the hint state explicitly.
  store.getState().resetSpinnerHint();
});
