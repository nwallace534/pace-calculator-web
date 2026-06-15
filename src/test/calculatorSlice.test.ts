// Unit-test exception (per testing-approach memory): the summary-view actions
// drive store state — pure logic, no DOM. The browser layer only smoke-tests
// that the wiring works (see summaryView.test.tsx).

import { describe, it, expect } from "vitest";
import useCalculatorStore from "@/state/useCalculatorStore";

const store = useCalculatorStore;

describe("calculatorSlice — summary view: open + close", () => {
  it("flips summaryViewOpen on open and back on close", () => {
    expect(store.getState().summaryViewOpen).toBe(false);
    store.getState().openSummaryView();
    expect(store.getState().summaryViewOpen).toBe(true);
    store.getState().closeSummaryView();
    expect(store.getState().summaryViewOpen).toBe(false);
  });
});

describe("calculatorSlice — summary view: arrivedFromShare flag", () => {
  it("openSummaryView leaves summaryArrivedFromShare false (plain card-open path)", () => {
    store.getState().openSummaryView();
    expect(store.getState().summaryArrivedFromShare).toBe(false);
  });

  it("openSummaryViewFromShare flips summaryArrivedFromShare to true", () => {
    store.getState().openSummaryViewFromShare();
    expect(store.getState().summaryViewOpen).toBe(true);
    expect(store.getState().summaryArrivedFromShare).toBe(true);
  });

  it("closeSummaryView clears summaryArrivedFromShare back to false", () => {
    store.getState().openSummaryViewFromShare();
    expect(store.getState().summaryArrivedFromShare).toBe(true);
    store.getState().closeSummaryView();
    expect(store.getState().summaryArrivedFromShare).toBe(false);
  });

  it("a subsequent plain openSummaryView clears any prior arrivedFromShare flag", () => {
    // E.g. share-link open, then user navigates away and re-opens the card
    // manually — the share-orientation hint shouldn't follow them.
    store.getState().openSummaryViewFromShare();
    expect(store.getState().summaryArrivedFromShare).toBe(true);
    store.getState().openSummaryView();
    expect(store.getState().summaryArrivedFromShare).toBe(false);
  });
});

describe("calculatorSlice — calculations always populated", () => {
  it("computes splits even when showSplits is false (no panel-driven gating)", () => {
    store.getState().setFullTime("0", "30", "0", "0");
    expect(store.getState().showSplits).toBe(false);
    expect(store.getState().splits).not.toBeNull();
    expect(store.getState().splits!.rows.length).toBeGreaterThan(0);
  });

  it("computes timesForPace even when showTimesForPace is false", () => {
    store.getState().setFullTime("0", "30", "0", "0");
    expect(store.getState().showTimesForPace).toBe(false);
    expect(store.getState().timesForPace).not.toBeNull();
  });
});
