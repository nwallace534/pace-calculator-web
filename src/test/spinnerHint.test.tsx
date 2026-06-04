import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";
import { pressSpinner, releaseSpinner, sleep, spinners } from "./helpers";

// Slice constants — mirrored here to keep the test readable without importing
// internals. If the slice tightens the threshold, update this.
const RAPID_TAP_THRESHOLD = 15;
const STORAGE_KEY = "pace-calculator:spinner-hint-seen";

const tap = async (button: HTMLElement, count: number) => {
  for (let i = 0; i < count; i++) {
    await userEvent.click(button);
  }
};

// Each SpinnerButton renders its own hint sibling inside the wrapping span,
// so we look up the right one relative to the button we're driving.
const hintFor = (button: HTMLElement) =>
  button.parentElement!.querySelector(".spinner-hint") as HTMLElement;

describe("Spinner hold-hint after rapid tapping", () => {
  it("stays hidden when the user taps fewer than the threshold times", async () => {
    render(<App />);

    const { increase } = spinners();
    await tap(increase, RAPID_TAP_THRESHOLD - 1);

    // The hint element is always in the DOM; the `spinner-hint-show` class is
    // what flips it from opacity:0/visibility:hidden to visible.
    expect(hintFor(increase)).not.toHaveClass("spinner-hint-show");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("appears after the threshold tap and persists the learned flag", async () => {
    render(<App />);

    const { increase } = spinners();
    expect(hintFor(increase)).not.toHaveClass("spinner-hint-show");

    await tap(increase, RAPID_TAP_THRESHOLD);

    expect(hintFor(increase)).toHaveClass("spinner-hint-show");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("does not re-fire once the user has already learned it", async () => {
    render(<App />);

    const { increase } = spinners();
    // Cross the threshold once, then keep tapping — registerSpinnerTap
    // short-circuits on `spinnerHintLearned`, so no further trigger is emitted.
    await tap(increase, RAPID_TAP_THRESHOLD);
    expect(hintFor(increase)).toHaveClass("spinner-hint-show");

    await tap(increase, RAPID_TAP_THRESHOLD);
    // Persisted flag stays exactly "true" — proves no duplicate retire path.
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("retires silently when the user discovers the hold gesture themselves", async () => {
    render(<App />);

    // Hold the spinner past the 250ms auto-repeat threshold so the release
    // hits the `repeatBegunRef` branch → onHold → registerSpinnerHold → retire.
    const { increase } = spinners();
    pressSpinner(increase);
    await sleep(450);
    releaseSpinner(increase);
    await sleep(150);

    // Discovered organically → no tutorial chip ever flashed.
    expect(hintFor(increase)).not.toHaveClass("spinner-hint-show");
    // But the learned flag is persisted, so future sessions skip the hint too.
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });
});
