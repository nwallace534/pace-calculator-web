import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";
import { pressSpinner, releaseSpinner, sleep, spinners } from "./helpers";

// HOLD_DELAY = 250ms before auto-repeat begins, then MIN_RATE = 14 steps/sec
// ramping toward MAX_RATE = 150 steps/sec. Starting two seconds away from a
// bound, the disable-on-hit short-circuit lands the loop in well under 500ms;
// 900ms is the wait we hold for to leave generous headroom for rAF jitter.
const HOLD_MS = 900;
// Decay tau is 45ms — after release, velocity falls under STOP_RATE quickly
// and the loop stops. Wait briefly so the last step lands before assertions.
const POST_RELEASE_MS = 150;

describe("Spinner hold (auto-repeat)", () => {
  it("holding minus near zero clamps the time to 00:00 and disables the button", async () => {
    render(<App />);

    // 5K default boots to 25:00. Drag both fields down close to the floor so
    // the auto-repeat only has a couple of steps to walk through.
    await userEvent.fill(screen.getByLabelText("minutes"), "0");
    await userEvent.fill(screen.getByLabelText("seconds"), "3");
    expect(screen.getByLabelText("minutes")).toHaveValue("00");
    expect(screen.getByLabelText("seconds")).toHaveValue("03");

    const { decrease } = spinners();
    pressSpinner(decrease);
    await sleep(HOLD_MS);
    releaseSpinner(decrease);
    await sleep(POST_RELEASE_MS);

    expect(screen.getByLabelText("minutes")).toHaveValue("00");
    expect(screen.getByLabelText("seconds")).toHaveValue("00");
    // atMin → disabled propagates back, halting any in-flight auto-repeat.
    expect(decrease).toBeDisabled();
  });

  it("holding plus near the cap clamps the time to 59:59 and disables the button", async () => {
    render(<App />);

    // 5K has no hours field, so its upper bound is 59:59.999. Start two
    // seconds shy of the cap.
    await userEvent.fill(screen.getByLabelText("minutes"), "59");
    await userEvent.fill(screen.getByLabelText("seconds"), "57");

    const { increase } = spinners();
    pressSpinner(increase);
    await sleep(HOLD_MS);
    releaseSpinner(increase);
    await sleep(POST_RELEASE_MS);

    expect(screen.getByLabelText("minutes")).toHaveValue("59");
    expect(screen.getByLabelText("seconds")).toHaveValue("59");
    expect(increase).toBeDisabled();
  });

  it("holding plus on a hundredths event clamps to 59:59.99 and disables the button", async () => {
    render(<App />);
    await userEvent.selectOptions(
      screen.getByLabelText("Selected run distance"),
      "eightHundredMeters",
    );

    // 800m shows hundredths (sub-second stepMs=10). The upper bound including
    // the hundredths tail is 59:59.99; start a couple of hundredths shy.
    await userEvent.fill(screen.getByLabelText("minutes"), "59");
    await userEvent.fill(screen.getByLabelText("seconds"), "59");
    await userEvent.fill(screen.getByLabelText("hundredths"), "97");

    const { increase } = spinners();
    pressSpinner(increase);
    await sleep(HOLD_MS);
    releaseSpinner(increase);
    await sleep(POST_RELEASE_MS);

    expect(screen.getByLabelText("minutes")).toHaveValue("59");
    expect(screen.getByLabelText("seconds")).toHaveValue("59");
    expect(screen.getByLabelText("hundredths")).toHaveValue("99");
    expect(increase).toBeDisabled();
  });
});
