// Unit-test exception (per testing-approach memory): the summary-view actions
// drive store state and recompute splits via getCalculationUpdate — pure
// logic with no DOM. The browser layer only smoke-tests that the wiring
// works (see summaryView.test.tsx); per-action state guarantees live here.

import { describe, it, expect } from "vitest";
import useCalculatorStore from "@/state/useCalculatorStore";

const store = useCalculatorStore;

describe("calculatorSlice — summary view: open + close basics", () => {
  it("flips summaryViewOpen on open and back on close", () => {
    expect(store.getState().summaryViewOpen).toBe(false);
    store.getState().openSummaryView();
    expect(store.getState().summaryViewOpen).toBe(true);
    store.getState().closeSummaryView();
    expect(store.getState().summaryViewOpen).toBe(false);
  });

  it("force-enables showSplits when opening (so the splits section renders)", () => {
    // Reproduce the bug the action's comment guards against: open the card
    // from a session where the splits panel is collapsed.
    store.setState({ showSplits: false });
    store.getState().openSummaryView();
    expect(store.getState().showSplits).toBe(true);
  });

  it("populates the splits result on open so the card has data to show", () => {
    // Without the calculationUpdate, the card would render with splits=null
    // even though showSplits flipped to true.
    store.setState({ showSplits: false, splits: null });
    store.getState().openSummaryView();
    const { splits } = store.getState();
    expect(splits).not.toBeNull();
    expect(splits!.rows.length).toBeGreaterThan(0);
  });
});

describe("calculatorSlice — summary view: showSplits restore-on-close", () => {
  it("restores showSplits to true when it was true before opening", () => {
    store.setState({ showSplits: true });
    store.getState().openSummaryView();
    expect(store.getState().showSplits).toBe(true);
    store.getState().closeSummaryView();
    expect(store.getState().showSplits).toBe(true);
  });

  it("restores showSplits to false when the user had it collapsed before opening", () => {
    // This is the regression-prone branch: open forces showSplits true, but
    // closing must put it back so the user doesn't return to the calculator
    // with an unexpectedly-open splits panel.
    store.setState({ showSplits: false });
    store.getState().openSummaryView();
    expect(store.getState().showSplits).toBe(true);
    store.getState().closeSummaryView();
    expect(store.getState().showSplits).toBe(false);
  });

  it("clears showSplitsBeforeSummary on close so the next open re-captures fresh state", () => {
    store.setState({ showSplits: false });
    store.getState().openSummaryView();
    expect(store.getState().showSplitsBeforeSummary).toBe(false);
    store.getState().closeSummaryView();
    expect(store.getState().showSplitsBeforeSummary).toBeNull();

    // Re-open from a different showSplits: the captured value reflects the
    // new pre-open state, not a stale carry-over.
    store.setState({ showSplits: true });
    store.getState().openSummaryView();
    expect(store.getState().showSplitsBeforeSummary).toBe(true);
  });

  it("preserves the originally-captured prior when openSummaryView is called while already open", () => {
    // E.g. a reactive URL update fires openSummaryView a second time while
    // the user is already inside the card. The captured "before" state must
    // remain the genuine pre-open value, not the now-forced-true one.
    store.setState({ showSplits: false });
    store.getState().openSummaryView();
    expect(store.getState().showSplitsBeforeSummary).toBe(false);
    // Second open call (still inside the card) — must not overwrite the
    // captured prior with the current showSplits (which is now true).
    store.getState().openSummaryView();
    expect(store.getState().showSplitsBeforeSummary).toBe(false);
  });

  it("no-ops on close when nothing was ever opened (showSplitsBeforeSummary null)", () => {
    // Defensive: a stray closeSummaryView from a UI transition shouldn't
    // touch showSplits if no open ever captured a prior.
    store.setState({ showSplits: true, showSplitsBeforeSummary: null });
    store.getState().closeSummaryView();
    expect(store.getState().showSplits).toBe(true);
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

  it("openSummaryViewFromShare follows the same showSplits force-on + restore rules as openSummaryView", () => {
    // Open with showSplits collapsed; FromShare path should also force-on
    // and remember to restore on close.
    store.setState({ showSplits: false });
    store.getState().openSummaryViewFromShare();
    expect(store.getState().showSplits).toBe(true);
    expect(store.getState().showSplitsBeforeSummary).toBe(false);
    store.getState().closeSummaryView();
    expect(store.getState().showSplits).toBe(false);
  });
});
