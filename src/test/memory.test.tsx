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

// Read the time cell for a given event row in the Times-for-pace table.
const timesForPaceRowText = (eventLabel: string) =>
  within(timesForPaceCard()).getByText(eventLabel).closest("tr")!.textContent ??
  "";

describe("Per-event memory across event switches", () => {
  it("remembers the user's time on an event when they navigate away and back", async () => {
    render(<App />);

    // Customise 5K → 30:00 (default is 29:59, so clear seconds too).
    await userEvent.fill(screen.getByLabelText("minutes"), "30");
    await userEvent.fill(screen.getByLabelText("seconds"), "00");
    expect(paceCellText("Pace per km")).toMatch(/^06:00\s+\/km$/);

    // Switch to Marathon → loads its 03:59:59 default, NOT 5K's edit.
    await selectEvent("marathon");
    expect(screen.getByLabelText("hours")).toHaveValue("03");
    expect(screen.getByLabelText("minutes")).toHaveValue("59");

    // Back to 5K → the user's 30:00 is restored, pace reflects it.
    await selectEvent("fiveK");
    expect(screen.getByLabelText("minutes")).toHaveValue("30");
    expect(screen.getByLabelText("seconds")).toHaveValue("00");
    expect(paceCellText("Pace per km")).toMatch(/^06:00\s+\/km$/);
  });

  it("remembers each event independently across many switches", async () => {
    render(<App />);

    // Edit 5K (25 → 28).
    await userEvent.fill(screen.getByLabelText("minutes"), "28");

    // Edit 10K (55 → 50).
    await selectEvent("tenK");
    await userEvent.fill(screen.getByLabelText("minutes"), "50");

    // Edit Marathon (3:59:59 → 4:00:00).
    await selectEvent("marathon");
    await userEvent.fill(screen.getByLabelText("hours"), "4");
    await userEvent.fill(screen.getByLabelText("minutes"), "0");
    await userEvent.fill(screen.getByLabelText("seconds"), "0");

    // Each event returns to its own remembered value.
    await selectEvent("fiveK");
    expect(screen.getByLabelText("minutes")).toHaveValue("28");

    await selectEvent("tenK");
    expect(screen.getByLabelText("hours")).toHaveValue("00");
    expect(screen.getByLabelText("minutes")).toHaveValue("50");

    await selectEvent("marathon");
    expect(screen.getByLabelText("hours")).toHaveValue("04");
    expect(screen.getByLabelText("minutes")).toHaveValue("00");
    expect(screen.getByLabelText("seconds")).toHaveValue("00");
  });

  it("keeps an already-open splits panel in sync through a round trip", async () => {
    render(<App />);

    // Open splits, customise time. Splits show 5 rows ending at 00:30:00.
    // Default 5K seeds seconds at "59", so clear it to land on a round 30:00.
    await userEvent.click(screen.getByText("Splits"));
    await userEvent.fill(screen.getByLabelText("minutes"), "30");
    await userEvent.fill(screen.getByLabelText("seconds"), "00");
    let rows = within(splitsCard()).getAllByRole("row");
    expect(rows).toHaveLength(1 + 5);
    expect(within(rows[5]).getByText("00:30:00")).toBeInTheDocument();

    // Switching events recomputes splits for the new event mid-flight.
    await selectEvent("marathon");
    rows = within(splitsCard()).getAllByRole("row");
    expect(rows.length).toBe(1 + 27); // marathon splits, distinct from 5K

    // Back to 5K → splits recomputed against the remembered 30:00.
    await selectEvent("fiveK");
    rows = within(splitsCard()).getAllByRole("row");
    expect(rows).toHaveLength(1 + 5);
    expect(within(rows[5]).getByText("00:30:00")).toBeInTheDocument();
  });

  it("computes a freshly-opened splits panel against the remembered time (collapsed during the edit)", async () => {
    render(<App />);

    // Splits start collapsed — explicitly verify, since that's the edge case.
    expect(within(splitsCard()).queryByRole("table")).toBeNull();
    await userEvent.fill(screen.getByLabelText("minutes"), "30");
    await userEvent.fill(screen.getByLabelText("seconds"), "00");

    await selectEvent("marathon");
    await selectEvent("fiveK");

    // Open splits AFTER the round trip — the calculation runs at open time
    // and must use the restored 30:00, not the 29:59 default.
    await userEvent.click(screen.getByText("Splits"));
    const rows = within(splitsCard()).getAllByRole("row");
    expect(rows).toHaveLength(1 + 5);
    expect(within(rows[5]).getByText("00:30:00")).toBeInTheDocument();
  });

  it("keeps Times-for-pace in sync with the remembered time across switches", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Times for pace"));

    // Capture 5K row at the default 29:59, then change to 30:00 (clear
    // seconds too — the new default seeds them at "59").
    const fiveKRowAtDefault = timesForPaceRowText("5K");
    await userEvent.fill(screen.getByLabelText("minutes"), "30");
    await userEvent.fill(screen.getByLabelText("seconds"), "00");
    const fiveKRowAtThirty = timesForPaceRowText("5K");
    expect(fiveKRowAtThirty).not.toBe(fiveKRowAtDefault);
    expect(fiveKRowAtThirty).toMatch(/00:30:00/);

    // Switch to marathon — same row recomputes against marathon's pace.
    await selectEvent("marathon");
    const fiveKRowAtMarathonPace = timesForPaceRowText("5K");
    expect(fiveKRowAtMarathonPace).not.toBe(fiveKRowAtThirty);

    // Back to 5K — row reverts to the user's remembered 30:00.
    await selectEvent("fiveK");
    expect(timesForPaceRowText("5K")).toBe(fiveKRowAtThirty);
  });
});
