import { screen } from "@testing-library/react";
import { userEvent } from "vitest/browser";

// Returns the rendered text of the <output> next to a pace label
// (e.g. "Pace per km" → "05:00 /km"). Used to assert all four pace cells.
export const paceCellText = (label: string) =>
  screen.getByText(label).parentElement!.querySelector("output")!.textContent;

export const splitsCard = () => screen.getByTestId("card-splits");
export const timesForPaceCard = () => screen.getByTestId("card-times-for-pace");

export const spinners = () => ({
  decrease: screen.getByRole("button", { name: "Decrease time" }),
  increase: screen.getByRole("button", { name: "Increase time" }),
});

export const selectEvent = async (eventId: string) => {
  await userEvent.selectOptions(
    screen.getByLabelText("Selected run distance"),
    eventId,
  );
};

// Clear each visible time field so subsequent typing tests start from a
// predictable "00" baseline (validator pads empty input to two zeros).
export const clearTimeFields = async (...labels: string[]) => {
  for (const label of labels) {
    const el = screen.queryByLabelText(label);
    if (el) await userEvent.fill(el, "");
  }
};

// Type one character at a time, awaiting each — userEvent.type fires events
// faster than React reconciles the controlled value, which causes the change
// handler to read stale event.target.value and misjudge whether to auto-skip.
// keyboard() with a per-char await gives React time to commit between strokes.
export const typeChars = async (text: string) => {
  for (const ch of text) {
    await userEvent.keyboard(ch);
  }
};

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// userEvent in vitest/browser has no hold-style pointer API, so we drive the
// SpinnerButton's React `onPointerDown` / `onPointerUp` handlers by dispatching
// native PointerEvents directly. They bubble to React's root delegation and
// trigger the synthetic handlers exactly as a real press would.
const dispatchPointer = (
  button: HTMLElement,
  type: "pointerdown" | "pointerup",
) => {
  button.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
    }),
  );
};

export const pressSpinner = (button: HTMLElement) =>
  dispatchPointer(button, "pointerdown");

export const releaseSpinner = (button: HTMLElement) =>
  dispatchPointer(button, "pointerup");
