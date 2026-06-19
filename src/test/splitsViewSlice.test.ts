import { describe, expect, it } from "vitest";
import useCalculatorStore from "@/state/useCalculatorStore";

const store = useCalculatorStore;

describe("splitsViewSlice — setSplitsViewSelection", () => {
  it("stores the chosen option key under the event id for the current session", () => {
    store.getState().setSplitsViewSelection("fiveK", "miles");

    expect(store.getState().splitsViewSelections).toEqual({ fiveK: "miles" });
  });

  it("merges new event selections into the existing record without dropping prior entries", () => {
    store.getState().setSplitsViewSelection("fiveK", "miles");
    store.getState().setSplitsViewSelection("marathon", "K");

    expect(store.getState().splitsViewSelections).toEqual({
      fiveK: "miles",
      marathon: "K",
    });
  });

  it("overrides the selected key when the user changes their mind on the same event", () => {
    store.getState().setSplitsViewSelection("tenK", "K");
    store.getState().setSplitsViewSelection("tenK", "miles");

    expect(store.getState().splitsViewSelections).toEqual({ tenK: "miles" });
  });

  it("does not persist selections to localStorage", () => {
    store.getState().setSplitsViewSelection("fiveK", "miles");

    expect(window.localStorage.length).toBe(0);
  });
});
