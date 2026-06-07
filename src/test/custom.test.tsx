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

// Custom-distance NumericInputs have no associated <label>, so we look them
// up by id. Tightly coupled to Distance.tsx but the alternative (className /
// placeholder match) would be just as brittle and less obvious to read.
const customDistance = () =>
  document.getElementById("distance") as HTMLInputElement;
const customDistanceDecimal = () =>
  document.getElementById("distanceDecimal") as HTMLInputElement;

describe("Custom (road) — happy path", () => {
  it("starts blank on first selection (no inheritance from the prior event)", async () => {
    render(<App />);
    // Sanity: default 5K paints 29:59 / 5km / 05:59 /km.
    expect(paceCellText("Pace per km")).toMatch(/^05:59\s+\/km$/);

    await selectEvent("Custom");

    // No inherited 5km / 29:59 — distance and time are blank.
    expect(customDistance()).toHaveValue("");
    expect(customDistanceDecimal()).toHaveValue("");
    expect(screen.getByLabelText("hours")).toHaveValue("00");
    expect(screen.getByLabelText("minutes")).toHaveValue("00");
    expect(screen.getByLabelText("seconds")).toHaveValue("00");
  });

  it("remembers the user's custom distance and time across event switches", async () => {
    render(<App />);
    await selectEvent("Custom");

    // Set a deliberately non-default distance (7.5 km) and time (40:00).
    await userEvent.fill(customDistance(), "7");
    await userEvent.fill(customDistanceDecimal(), "5");
    await userEvent.fill(screen.getByLabelText("minutes"), "40");

    // Round trip via Marathon.
    await selectEvent("marathon");
    await selectEvent("Custom");

    expect(customDistance()).toHaveValue("7");
    expect(customDistanceDecimal()).toHaveValue("5");
    expect(screen.getByLabelText("minutes")).toHaveValue("40");
  });

  it("shows hours and hides hundredths regardless of origin event", async () => {
    render(<App />);
    // 5K: no hours field, no hundredths field.
    expect(screen.queryByLabelText("hours")).toBeNull();
    expect(screen.queryByLabelText("hundredths")).toBeNull();

    await selectEvent("Custom");
    // Custom (road) always shows hours; hundredths stays hidden.
    expect(screen.getByLabelText("hours")).toBeInTheDocument();
    expect(screen.queryByLabelText("hundredths")).toBeNull();
  });

  it("does not surface a goals-and-records dropdown", async () => {
    render(<App />);
    await selectEvent("Custom");
    expect(
      screen.queryByRole("button", { name: /goals and records/i }),
    ).toBeNull();
  });

  it("offers only km and miles in the unit dropdown — no meters", async () => {
    render(<App />);
    await selectEvent("Custom");

    // Native select — read the rendered <option> children directly.
    const select = document.getElementById(
      "labelDistanceUnit",
    ) as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((o) => o.textContent);
    expect(optionLabels).toEqual(["K", "miles"]);
  });

  it("recomputes splits and times & predictions when the custom distance changes", async () => {
    render(<App />);
    await userEvent.click(screen.getByText("Splits"));
    await userEvent.click(screen.getByText("Times & predictions"));

    await selectEvent("Custom");
    // Custom starts blank — enter a 5km/25:00 to get a comparable baseline.
    await userEvent.fill(customDistance(), "5");
    await userEvent.fill(screen.getByLabelText("minutes"), "25");
    let rows = within(splitsCard()).getAllByRole("row");
    expect(rows).toHaveLength(1 + 5);

    // Stretch distance to 8km — splits now 8 rows, and times & predictions shifts too.
    const tenKBefore = within(timesForPaceCard())
      .getByText("10K")
      .closest("tr")!.textContent;
    await userEvent.fill(customDistance(), "8");

    rows = within(splitsCard()).getAllByRole("row");
    expect(rows).toHaveLength(1 + 8);

    const tenKAfter = within(timesForPaceCard())
      .getByText("10K")
      .closest("tr")!.textContent;
    expect(tenKAfter).not.toBe(tenKBefore);
  });
});

describe("Custom (track) — happy path", () => {
  it("starts blank, with meters as a static label (no unit dropdown)", async () => {
    render(<App />);
    await selectEvent("CustomTrack");

    // Distance + time blank on first selection.
    expect(customDistance()).toHaveValue("");
    expect(customDistanceDecimal()).toHaveValue("");
    expect(screen.getByLabelText("seconds")).toHaveValue("00");

    // Unit is fixed: rendered as plain "meters" text, no select control.
    expect(screen.getByText("meters")).toBeInTheDocument();
    expect(document.getElementById("labelDistanceUnit")).toBeNull();
  });

  it("hides hours and shows hundredths", async () => {
    render(<App />);
    await selectEvent("CustomTrack");

    expect(screen.queryByLabelText("hours")).toBeNull();
    expect(screen.getByLabelText("minutes")).toBeInTheDocument();
    expect(screen.getByLabelText("seconds")).toBeInTheDocument();
    expect(screen.getByLabelText("hundredths")).toBeInTheDocument();
  });

  it("computes splits in 100m intervals, labelled in m", async () => {
    render(<App />);
    await selectEvent("CustomTrack");

    // 300m in 45.50 — three 100m splits.
    await userEvent.fill(customDistance(), "300");
    await userEvent.fill(screen.getByLabelText("seconds"), "45");
    await userEvent.fill(screen.getByLabelText("hundredths"), "50");

    await userEvent.click(screen.getByText("Splits"));
    const rows = within(splitsCard()).getAllByRole("row");
    expect(rows).toHaveLength(1 + 3);
    expect(within(rows[1]).getByText("100m")).toBeInTheDocument();
    expect(within(rows[2]).getByText("200m")).toBeInTheDocument();
    expect(within(rows[3]).getByText("300m")).toBeInTheDocument();

    // Meter-mode splits suppress the km/mi toggle — confirm it's absent.
    expect(within(splitsCard()).queryByText(/show in/i)).toBeNull();
  });

  it("keeps independent memory from Custom (road)", async () => {
    render(<App />);

    // Road Custom: 8km / 40:00.
    await selectEvent("Custom");
    await userEvent.fill(customDistance(), "8");
    await userEvent.fill(screen.getByLabelText("minutes"), "40");

    // Track Custom: 300m / 45s.
    await selectEvent("CustomTrack");
    expect(customDistance()).toHaveValue(""); // blank, not 8 from road
    await userEvent.fill(customDistance(), "300");
    await userEvent.fill(screen.getByLabelText("seconds"), "45");

    // Back to road Custom — its values are intact.
    await selectEvent("Custom");
    expect(customDistance()).toHaveValue("8");
    expect(screen.getByLabelText("minutes")).toHaveValue("40");

    // And back to track Custom — its values are also intact.
    await selectEvent("CustomTrack");
    expect(customDistance()).toHaveValue("300");
    expect(screen.getByLabelText("seconds")).toHaveValue("45");
  });

  it("does not surface a goals-and-records dropdown", async () => {
    render(<App />);
    await selectEvent("CustomTrack");
    expect(
      screen.queryByRole("button", { name: /goals and records/i }),
    ).toBeNull();
  });
});
