import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";
import { selectEvent } from "./helpers";

const openSummary = async () => {
  await userEvent.click(screen.getByRole("button", { name: /share/i }));
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

  it("restores the calculator when the close control is clicked", async () => {
    render(<App />);
    await openSummary();
    expect(screen.queryByAltText("Pacerly logo")).toBeNull();

    await userEvent.click(screen.getByTestId("summary-close"));

    // Card unmounts after its close-out animation; wait for the navbar
    // to come back rather than asserting synchronously.
    expect(await screen.findByAltText("Pacerly logo")).toBeInTheDocument();
    expect(screen.queryByTestId("summary-card")).toBeNull();
  });
});

describe("Summary view — event-aware predictions", () => {
  it("5K goal hides the predictions section (middle range — no tier applies)", async () => {
    render(<App />);
    // Default 5K sits in the middle range between the short tier (≤ 3K) and
    // long tier (≥ 10K), so getPredictionFloorMeters returns null and the
    // section is omitted entirely.
    const card = await openSummary();

    expect(within(card).queryByTestId("summary-predictions")).toBeNull();
    expect(
      within(card).queryByTestId("summary-predictions-heading"),
    ).toBeNull();
  });

  it("marathon goal predicts the 5K/10K/half (long tier, 5K floor)", async () => {
    render(<App />);
    await selectEvent("marathon");

    const card = await openSummary();
    const rows = within(card).getAllByTestId("summary-prediction-row");
    const labels = rows.map((r) => r.textContent ?? "");

    // Three shorter TimesForPace events ≥ the 5K floor; "1/2 Mar" is the
    // SHORT_EVENT_LABELS override for halfMarathon to keep the column tight.
    // textContent concatenates label + time with no whitespace, so simple
    // startsWith / substring checks beat \b word boundaries.
    expect(labels).toHaveLength(3);
    expect(labels.some((l) => l.startsWith("5K"))).toBe(true);
    expect(labels.some((l) => l.startsWith("10K"))).toBe(true);
    expect(labels.some((l) => l.startsWith("1/2 Mar"))).toBe(true);

    // Marathon shouldn't predict itself (and the half marathon uses the
    // "1/2 Mar" short label, not "Marathon").
    expect(labels.some((l) => l.startsWith("Marathon"))).toBe(false);
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
    // Default 5K in km → 5 split rows; heading carries the unit.
    const card = await openSummary();
    const splits = within(card).getByTestId("summary-splits");
    const rows = within(splits).getAllByTestId("summary-split-row");
    expect(rows).toHaveLength(5);
    expect(within(card).getByText(/Splits in km/i)).toBeInTheDocument();
  });

  it("renders a marathon's full mile splits (26+ rows)", async () => {
    render(<App />);
    await selectEvent("marathon");
    const card = await openSummary();

    const splits = within(card).getByTestId("summary-splits");
    const rows = within(splits).getAllByTestId("summary-split-row");
    // 26 whole-mile rows + the 26.218 tail.
    expect(rows.length).toBeGreaterThanOrEqual(26);
    expect(within(card).getByText(/Splits in miles/i)).toBeInTheDocument();
  });

  it("renders interval reference rows shorter than the goal", async () => {
    render(<App />);
    // Default 5K → 400m, 800m, 1km, 1mi, 3000m all shorter than 5km.
    // Sprints (100m/200m) are filtered out by the endurance threshold.
    const card = await openSummary();
    const intervals = within(card).getByTestId("summary-intervals");
    const labels = within(intervals)
      .getAllByTestId("summary-interval-row")
      .map((r) => r.textContent ?? "");
    expect(labels.some((l) => l.includes("400m"))).toBe(true);
    expect(labels.some((l) => l.includes("1km"))).toBe(true);
    expect(labels.some((l) => l.includes("1mi"))).toBe(true);
    // Endurance threshold suppresses the sprint references.
    expect(labels.some((l) => l.includes("100m"))).toBe(false);
    expect(labels.some((l) => l.includes("200m"))).toBe(false);
  });
});
