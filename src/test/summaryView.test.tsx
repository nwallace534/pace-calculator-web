import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";
import { selectEvent } from "./helpers";

const openSummary = async () => {
  await userEvent.click(screen.getByRole("button", { name: /race card/i }));
  return screen.getByTestId("summary-card");
};

describe("Summary view — entry and chrome", () => {
  it("hides the header and renders the summary card when opened", async () => {
    render(<App />);

    // Header is visible up front.
    expect(screen.getByAltText("Pacerly logo")).toBeInTheDocument();

    const card = await openSummary();
    expect(card).toBeInTheDocument();

    // Header / Footer should disappear so a screenshot is just the card.
    expect(screen.queryByAltText("Pacerly logo")).toBeNull();
  });

  it("restores the calculator when the Back button is clicked", async () => {
    render(<App />);
    await openSummary();
    expect(screen.queryByAltText("Pacerly logo")).toBeNull();

    await userEvent.click(screen.getByTestId("summary-back"));

    expect(screen.getByAltText("Pacerly logo")).toBeInTheDocument();
    expect(screen.queryByTestId("summary-card")).toBeNull();
  });
});

describe("Summary view — event-aware predictions", () => {
  it("5K goal shows shorter races only (800m, 1500m, 3000m); no 10K/half/marathon", async () => {
    render(<App />);
    // Default 5K is 29:59.
    const card = await openSummary();

    const predictions = within(card).getByTestId("summary-predictions");
    const labels = within(predictions)
      .getAllByRole("row")
      .map((r) => r.textContent ?? "");

    // Shorter TimesForPace events: 800m, 1500m, 3000m.
    expect(labels.some((l) => l.includes("800m"))).toBe(true);
    expect(labels.some((l) => l.includes("1500m"))).toBe(true);
    expect(labels.some((l) => l.includes("3000m"))).toBe(true);

    // No longer races.
    expect(labels.some((l) => l.includes("10K"))).toBe(false);
    expect(labels.some((l) => l.includes("Half Marathon"))).toBe(false);
    expect(labels.some((l) => l.includes("Marathon"))).toBe(false);
  });

  it("marathon goal shows all standard shorter races and excludes itself", async () => {
    render(<App />);
    await selectEvent("marathon");

    const card = await openSummary();
    const predictions = within(card).getByTestId("summary-predictions");
    const labels = within(predictions)
      .getAllByRole("row")
      .map((r) => r.textContent ?? "");

    expect(labels.some((l) => l.includes("Half Marathon"))).toBe(true);
    expect(labels.some((l) => l.includes("10K"))).toBe(true);
    expect(labels.some((l) => l.includes("5K"))).toBe(true);
    expect(labels.some((l) => l.includes("3000m"))).toBe(true);
    expect(labels.some((l) => l.includes("1500m"))).toBe(true);
    expect(labels.some((l) => l.includes("800m"))).toBe(true);

    // Marathon shouldn't predict itself.
    expect(labels.some((l) => /^Marathon\d/.test(l) || l === "Marathon")).toBe(
      false,
    );
  });

  it("800m goal hides the predictions section entirely (no shorter race)", async () => {
    render(<App />);
    await selectEvent("eightHundredMeters");

    const card = await openSummary();
    expect(within(card).queryByTestId("summary-predictions")).toBeNull();
    expect(
      within(card).queryByTestId("summary-predictions-heading"),
    ).toBeNull();
  });
});

describe("Summary view — splits and intervals", () => {
  it("renders condensed splits matching the entered distance", async () => {
    render(<App />);
    // Default 5K in km → 5 split rows, indexed 1..5 with no unit suffix.
    const card = await openSummary();
    const splits = within(card).getByTestId("summary-splits");
    const rows = within(splits).getAllByTestId("summary-split-row");
    expect(rows).toHaveLength(5);
    expect(rows[0].textContent).toMatch(/^1\d/);
    expect(rows[4].textContent).toMatch(/^5\d/);
    // Heading carries the unit; rows don't.
    expect(within(card).getByText(/Splits in km/i)).toBeInTheDocument();
  });

  it("uses 3 columns and integer indices for a marathon (26+ splits)", async () => {
    render(<App />);
    await selectEvent("marathon");
    const card = await openSummary();

    const splits = within(card).getByTestId("summary-splits");
    expect(splits).toHaveStyle({ columnCount: "3" });

    const rows = within(splits).getAllByTestId("summary-split-row");
    // 26 whole-mile rows + the 26.218 tail.
    expect(rows.length).toBeGreaterThanOrEqual(26);
    expect(within(card).getByText(/Splits in miles/i)).toBeInTheDocument();
  });

  it("renders interval reference rows shorter than the goal", async () => {
    render(<App />);
    // Default 5K → 400m, 1km, 1mi all shorter than 5km.
    const card = await openSummary();
    const intervals = within(card).getByTestId("summary-intervals");
    const labels = within(intervals)
      .getAllByRole("row")
      .map((r) => r.textContent ?? "");
    expect(labels.some((l) => l.includes("400m"))).toBe(true);
    expect(labels.some((l) => l.includes("1km"))).toBe(true);
    expect(labels.some((l) => l.includes("1mi"))).toBe(true);
  });
});
