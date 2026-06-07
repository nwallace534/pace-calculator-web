import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";
import {
  paceCellText,
  splitsCard,
  timesForPaceCard,
  selectEvent,
} from "./helpers";

describe("Goals and records dropdown", () => {
  it("5K example fills the time and refreshes splits + times & predictions", async () => {
    render(<App />);

    // Open both result panels so we can verify they update after the click.
    await userEvent.click(screen.getByText("Splits"));
    await userEvent.click(screen.getByText("Times & predictions"));

    const paceBefore = paceCellText("Pace per km");
    const finalSplitBefore = within(splitsCard())
      .getAllByRole("row")
      .at(-1)!.textContent;
    const tenKRowBefore = within(timesForPaceCard())
      .getByText("10K")
      .closest("tr")!.textContent;

    // Open the "5K goals" dropdown and pick the Sub-20 example.
    // The sub20 entry in events.ts is 0h 19m 59s 00, so visible fields land
    // on 19 minutes / 59 seconds (hours is hidden for 5K).
    await userEvent.click(screen.getByRole("button", { name: /5K goals/i }));
    await userEvent.click(screen.getByRole("button", { name: /Sub 20 mins/i }));

    expect(screen.getByLabelText("minutes")).toHaveValue("19");
    expect(screen.getByLabelText("seconds")).toHaveValue("59");

    // Smoke check: pace, splits and times & predictions all reflect the new time.
    expect(paceCellText("Pace per km")).not.toBe(paceBefore);

    const finalSplitAfter = within(splitsCard())
      .getAllByRole("row")
      .at(-1)!.textContent;
    expect(finalSplitAfter).not.toBe(finalSplitBefore);

    const tenKRowAfter = within(timesForPaceCard())
      .getByText("10K")
      .closest("tr")!.textContent;
    expect(tenKRowAfter).not.toBe(tenKRowBefore);
  });

  it("Marathon example fills hours, minutes and seconds", async () => {
    render(<App />);
    await selectEvent("marathon");

    await userEvent.click(screen.getByText("Splits"));
    await userEvent.click(screen.getByText("Times & predictions"));

    const paceBefore = paceCellText("Pace per mile");
    const finalSplitBefore = within(splitsCard())
      .getAllByRole("row")
      .at(-1)!.textContent;
    const fiveKRowBefore = within(timesForPaceCard())
      .getByText("5K")
      .closest("tr")!.textContent;

    // Sub-3 marathon example = 02h 59m 59s 00.
    await userEvent.click(
      screen.getByRole("button", { name: /Marathon goals/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /Sub 3 hours/i }));

    expect(screen.getByLabelText("hours")).toHaveValue("02");
    expect(screen.getByLabelText("minutes")).toHaveValue("59");
    expect(screen.getByLabelText("seconds")).toHaveValue("59");

    expect(paceCellText("Pace per mile")).not.toBe(paceBefore);

    const finalSplitAfter = within(splitsCard())
      .getAllByRole("row")
      .at(-1)!.textContent;
    expect(finalSplitAfter).not.toBe(finalSplitBefore);

    const fiveKRowAfter = within(timesForPaceCard())
      .getByText("5K")
      .closest("tr")!.textContent;
    expect(fiveKRowAfter).not.toBe(fiveKRowBefore);
  });

  it("100m example fills seconds and hundredths to sub-second precision", async () => {
    render(<App />);
    await selectEvent("oneHundredMeters");

    await userEvent.click(screen.getByText("Splits"));
    const finalSplitBefore = within(splitsCard())
      .getAllByRole("row")
      .at(-1)!.textContent;

    // Flo-Jo's '88 women's WR = 0h 0m 10s 49 hundredths.
    await userEvent.click(screen.getByRole("button", { name: /100m goals/i }));
    await userEvent.click(screen.getByRole("button", { name: /Flo-Jo/i }));

    expect(screen.getByLabelText("seconds")).toHaveValue("10");
    expect(screen.getByLabelText("hundredths")).toHaveValue("49");

    const finalSplitAfter = within(splitsCard())
      .getAllByRole("row")
      .at(-1)!.textContent;
    expect(finalSplitAfter).not.toBe(finalSplitBefore);
    // The 100m split row shows hundredths — confirm the new time is there.
    expect(finalSplitAfter).toMatch(/00:10\.49/);
  });

  it("strips hundredths from a record when the event hides them (5K WR)", async () => {
    // 5K's mWR is 12:35.36, but the 5K UI hides the hundredths field. Loading
    // the sample must zero the hundredths in state — otherwise clearing the
    // visible fields would leave a hidden 360ms driving a phantom pace.
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /5K goals/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /Cheptegei '20 \(M WR\)/i }),
    );

    expect(screen.getByLabelText("minutes")).toHaveValue("12");
    expect(screen.getByLabelText("seconds")).toHaveValue("35");

    // Clear the visible time fields. With the bug, hundredths still held "36"
    // and the WR-pace warning kept firing; with the fix, the priority chain
    // returns to "needs time".
    await userEvent.fill(screen.getByLabelText("minutes"), "");
    await userEvent.fill(screen.getByLabelText("seconds"), "");

    expect(
      await screen.findByText("Enter a time to see your pace."),
    ).toBeInTheDocument();
  });
});
