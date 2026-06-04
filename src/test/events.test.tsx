import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";
import {
  paceCellText,
  splitsCard,
  timesForPaceCard,
  spinners,
  selectEvent,
} from "./helpers";

describe("5K (default event)", () => {
  it("paces, splits and times-for-pace react to time and unit changes", async () => {
    render(<App />);

    // Default 5K bootstraps to 29:59 → 05:59 /km, 10.0 km/h.
    expect(paceCellText("Pace per km")).toMatch(/^05:59\s+\/km$/);
    expect(paceCellText("Speed kph")).toMatch(/^10\.0\s+km\/h$/);

    // Change time → every pace cell reflects it. Clear seconds too so the
    // time lands on a round 30:00 (the new default seeds seconds at "59").
    await userEvent.fill(screen.getByLabelText("minutes"), "30");
    await userEvent.fill(screen.getByLabelText("seconds"), "00");
    expect(paceCellText("Pace per km")).toMatch(/^06:00\s+\/km$/);
    expect(paceCellText("Speed kph")).toMatch(/^10\.0\s+km\/h$/);

    // Open splits. 5K with default km unit → 5 splits at 1km intervals.
    await userEvent.click(screen.getByText("Splits"));
    let splitRows = within(splitsCard()).getAllByRole("row");
    expect(splitRows).toHaveLength(1 + 5);
    expect(within(splitRows[1]).getByText("1K")).toBeInTheDocument();
    expect(within(splitRows[5]).getByText("00:30:00")).toBeInTheDocument();

    // Toggle splits to miles. 5km ≈ 3.11mi → 4 splits (1, 2, 3, partial).
    await userEvent.click(within(splitsCard()).getByText(/show in miles/i));
    splitRows = within(splitsCard()).getAllByRole("row");
    expect(splitRows).toHaveLength(1 + 4);
    expect(within(splitRows[1]).getByText("1 mile")).toBeInTheDocument();

    // Open Times for Pace; confirm standard events appear.
    await userEvent.click(screen.getByText("Times for pace"));
    const timesCard = timesForPaceCard();
    expect(within(timesCard).getByText("5K")).toBeInTheDocument();
    expect(within(timesCard).getByText("10K")).toBeInTheDocument();
    const fiveKRowBefore = within(timesCard)
      .getByText("5K")
      .closest("tr")!.textContent;

    // Change time again → paces, splits (still in miles) and times-for-pace
    // all reflect the new pace. Seconds is still "00" from the previous fill.
    await userEvent.fill(screen.getByLabelText("minutes"), "20");
    expect(paceCellText("Pace per km")).toMatch(/^04:00\s+\/km$/);

    const fiveKRowAfter = within(timesCard)
      .getByText("5K")
      .closest("tr")!.textContent;
    expect(fiveKRowAfter).not.toBe(fiveKRowBefore);

    splitRows = within(splitsCard()).getAllByRole("row");
    expect(splitRows).toHaveLength(1 + 4);
    expect(splitRows[1].textContent).toMatch(/1 mile/);
  });

  it("Splits and Times for pace start collapsed and toggle on click", async () => {
    render(<App />);

    // Children are only rendered when expanded, so the inner table is absent.
    expect(within(splitsCard()).queryByRole("table")).toBeNull();
    expect(within(timesForPaceCard()).queryByRole("table")).toBeNull();

    // Expand both → content appears.
    await userEvent.click(screen.getByText("Splits"));
    expect(within(splitsCard()).getByRole("table")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Times for pace"));
    expect(within(timesForPaceCard()).getByRole("table")).toBeInTheDocument();

    // Click again → collapses.
    await userEvent.click(screen.getByText("Splits"));
    expect(within(splitsCard()).queryByRole("table")).toBeNull();

    await userEvent.click(screen.getByText("Times for pace"));
    expect(within(timesForPaceCard()).queryByRole("table")).toBeNull();
  });

  it("spinner up/down steps the time by 1 second and recalculates the pace", async () => {
    render(<App />);

    expect(screen.getByLabelText("seconds")).toHaveValue("59");
    expect(screen.getByLabelText("minutes")).toHaveValue("29");

    const { decrease, increase } = spinners();

    // Up once from 29:59 → carries seconds to 30:00.
    await userEvent.click(increase);
    expect(screen.getByLabelText("minutes")).toHaveValue("30");
    expect(screen.getByLabelText("seconds")).toHaveValue("00");

    // Down twice from 30:00 → underflows back through 29:59 to 29:58.
    await userEvent.click(decrease);
    await userEvent.click(decrease);
    expect(screen.getByLabelText("minutes")).toHaveValue("29");
    expect(screen.getByLabelText("seconds")).toHaveValue("58");

    // Pace reflects 29:58 / 5km — 359.6 sec/km, displayed as 05:59 /km.
    expect(paceCellText("Pace per km")).toMatch(/^05:59\s+\/km$/);
  });
});

describe("Marathon", () => {
  it("computes paces, speeds and 27 mile splits at default 03:59:59", async () => {
    render(<App />);
    await selectEvent("marathon");

    // 03:59:59 over 26.218 mi → ~05:41 /km, ~09:09 /mile, 10.6 km/h.
    expect(paceCellText("Pace per km")).toMatch(/^05:41\s+\/km$/);
    expect(paceCellText("Pace per mile")).toMatch(/^09:09\s+\/mile$/);
    expect(paceCellText("Speed kph")).toMatch(/^10\.6\s+km\/h$/);

    // Distance is in miles, splits follow distanceUnit → 1-mile intervals.
    // 26.218 → 26 whole-mile rows + a 26.22 mi partial = 27 rows.
    await userEvent.click(screen.getByText("Splits"));
    const rows = within(splitsCard()).getAllByRole("row");
    expect(rows).toHaveLength(1 + 27);
    expect(within(rows[1]).getByText("1 mile")).toBeInTheDocument();
    expect(within(rows[26]).getByText("26 mile")).toBeInTheDocument();
    expect(within(rows[27]).getByText("26.22 mile")).toBeInTheDocument();
  });
});

describe("800m", () => {
  it("uses 400m lap splits, no unit toggle, hundredths-precision times", async () => {
    render(<App />);
    await selectEvent("eightHundredMeters");

    // Default 02:30.00 → 03:07 /km (hundredths suppressed on the pace row).
    expect(paceCellText("Pace per km")).toMatch(/^03:07\s+\/km$/);

    // Hundredths field is visible and seeded with "00".
    expect(screen.getByLabelText("hundredths")).toHaveValue("00");

    // Open splits: 2 × 400m. Meter-split events suppress the km/mile toggle.
    await userEvent.click(screen.getByText("Splits"));
    expect(within(splitsCard()).queryByText(/show in/i)).toBeNull();
    const rows = within(splitsCard()).getAllByRole("row");
    expect(rows).toHaveLength(1 + 2);
    expect(within(rows[1]).getByText("400m")).toBeInTheDocument();
    expect(within(rows[2]).getByText("800m")).toBeInTheDocument();
    // Split times include hundredths (e.g. "02:30.00" for the final row).
    expect(within(rows[2]).getByText(/02:30\.00/)).toBeInTheDocument();
  });
});

describe("1500m", () => {
  it("uses the track pattern (300m opening + 400m laps) with a summary line", async () => {
    render(<App />);
    await selectEvent("fifteenHundredMeters");

    // Default 05:30.00 over 1500m → 03:40 /km.
    expect(paceCellText("Pace per km")).toMatch(/^03:40\s+\/km$/);

    await userEvent.click(screen.getByText("Splits"));

    // Four cumulative landmarks on the track: 300, 700, 1100, 1500m.
    const rows = within(splitsCard()).getAllByRole("row");
    expect(rows).toHaveLength(1 + 4);
    expect(within(rows[1]).getByText("300m")).toBeInTheDocument();
    expect(within(rows[2]).getByText("700m")).toBeInTheDocument();
    expect(within(rows[3]).getByText("1100m")).toBeInTheDocument();
    expect(within(rows[4]).getByText("1500m")).toBeInTheDocument();

    // Track summary surfaces the opening leg and steady-state lap pace.
    expect(
      within(splitsCard()).getByText(/First 300m in .* 400m laps in/i),
    ).toBeInTheDocument();
  });
});

describe("100m", () => {
  it("hides minutes, shows hundredths, single 100m split", async () => {
    render(<App />);
    await selectEvent("oneHundredMeters");

    // Minutes field is hidden for 100m; hundredths is shown.
    expect(screen.queryByLabelText("minutes")).toBeNull();
    expect(screen.getByLabelText("seconds")).toHaveValue("14");
    expect(screen.getByLabelText("hundredths")).toHaveValue("99");

    // 14.99s over 100m → 02:29 /km, 24.0 km/h.
    expect(paceCellText("Pace per km")).toMatch(/^02:29\s+\/km$/);
    expect(paceCellText("Speed kph")).toMatch(/^24\.0\s+km\/h$/);

    // Splits panel: exactly one 100m row.
    await userEvent.click(screen.getByText("Splits"));
    const rows = within(splitsCard()).getAllByRole("row");
    expect(rows).toHaveLength(1 + 1);
    expect(within(rows[1]).getByText("100m")).toBeInTheDocument();
    expect(within(rows[1]).getByText(/00:14\.99/)).toBeInTheDocument();
  });
});
