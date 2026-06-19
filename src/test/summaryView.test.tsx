// Smoke-only browser coverage (see test-layering-with-screenshots memory):
// per-event variety lives in the screenshot script and the summaryRows /
// trackLandmarks unit suites. These tests only prove the component wires up
// for the behaviours that can't be unit-tested cleanly — open/close, controls
// autohide, title editing, the splits-view picker — and run one of each
// event type (track / middle distance / most popular) so we'd catch a wiring
// regression that breaks only one path.

import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";
import { selectEvent } from "./helpers";

const openSummary = async () => {
  await userEvent.click(screen.getByRole("button", { name: /open card/i }));
  return screen.getByTestId("summary-card");
};

describe("Summary view — entry and controls", () => {
  it("opens, hides the navbar, and renders the card's main sections", async () => {
    render(<App />);

    // Navbar is visible up front.
    expect(screen.getByAltText("Pacerly logo")).toBeInTheDocument();

    const card = await openSummary();
    expect(card).toBeInTheDocument();

    // Navbar disappears so a screenshot is just the card.
    expect(screen.queryByAltText("Pacerly logo")).toBeNull();

    // Default 5K renders branding + intervals + splits; predictions are
    // correctly omitted (5K is in the middle range).
    expect(within(card).getByTestId("summary-branding")).toBeInTheDocument();
    expect(within(card).getByTestId("summary-intervals")).toBeInTheDocument();
    expect(within(card).getByTestId("summary-splits")).toBeInTheDocument();
    expect(within(card).queryByTestId("summary-predictions")).toBeNull();
  });

  it("closes via the close control and restores the calculator", async () => {
    render(<App />);
    await openSummary();
    expect(screen.queryByAltText("Pacerly logo")).toBeNull();

    await userEvent.click(screen.getByTestId("summary-close"));

    // Card unmounts after its close-out animation; wait for the navbar
    // to come back rather than asserting synchronously.
    expect(await screen.findByAltText("Pacerly logo")).toBeInTheDocument();
    expect(screen.queryByTestId("summary-card")).toBeNull();
  });

  it("fades the controls out after the 3-second autohide timeout", async () => {
    render(<App />);
    await openSummary();

    const controls = screen.getByTestId("summary-controls-left");

    // Mounts hidden, then rAF fires the fade-in. Wait until visible first so
    // we're measuring the fade-out from a known state.
    await waitFor(() => {
      expect(controls).toHaveStyle({ opacity: "1" });
    });

    // 3000ms autohide + 500ms transition + slack.
    await waitFor(
      () => {
        expect(controls).toHaveStyle({ opacity: "0" });
      },
      { timeout: 5000 },
    );
  });
});

describe("Summary view — title editing", () => {
  it("commits the edit and exits edit mode when the user taps anywhere off the input", async () => {
    render(<App />);
    const card = await openSummary();

    // Open the title editor via the pencil.
    await userEvent.click(within(card).getByTestId("summary-title-edit"));
    const input = within(card).getByTestId("summary-title-input");
    await userEvent.type(input, "Race day plan");

    // Click anywhere outside the input — the splits area is convenient,
    // doesn't stopPropagation, and is well inside the card.
    await userEvent.click(within(card).getByTestId("summary-splits"));

    // Display flips back, the input goes away, and the typed title sticks.
    await waitFor(() => {
      expect(within(card).queryByTestId("summary-title-input")).toBeNull();
    });
    expect(within(card).getByTestId("summary-title-display")).toHaveTextContent(
      "Race day plan",
    );
  });
});

describe("Summary view — per event type", () => {
  it("track sprint (100m) opens cleanly and hides the splits-view picker", async () => {
    render(<App />);
    await selectEvent("oneHundredMeters");

    const card = await openSummary();
    // Splits still render — a single 100m landmark row.
    const rows = within(card)
      .getByTestId("summary-splits")
      .querySelectorAll('[data-testid="summary-split-row"]');
    expect(rows.length).toBeGreaterThanOrEqual(1);

    // Sub-400m only has the 100m option enabled, so the picker hides.
    expect(within(card).queryByTestId("splits-view-picker-toggle")).toBeNull();
  });

  it("middle distance (800m) picker flips lap landmarks to 100m intervals", async () => {
    render(<App />);
    await selectEvent("eightHundredMeters");

    const card = await openSummary();
    const splits = () => within(card).getByTestId("summary-splits");

    // Default: 2 lap landmarks ([400, 800]).
    expect(
      splits().querySelectorAll('[data-testid="summary-split-row"]'),
    ).toHaveLength(2);

    await userEvent.click(
      within(card).getByTestId("splits-view-picker-toggle"),
    );
    await userEvent.click(
      within(card).getByTestId("splits-view-option-hundredMeters"),
    );

    // After switch: 8 × 100m rows.
    await waitFor(() => {
      expect(
        splits().querySelectorAll('[data-testid="summary-split-row"]'),
      ).toHaveLength(8);
    });
  });

  it("most popular event (5K) picker flips km to miles", async () => {
    render(<App />);
    // 5K is the default event — no selectEvent call needed.

    const card = await openSummary();
    // Bold heading shows the selected unit; the "Modify splits" trigger
    // sits beside it. Assert on the heading by testid (the menu items also
    // contain the unit-label text).
    expect(
      within(card).getByTestId("summary-splits-heading"),
    ).toHaveTextContent(/Splits in Kilometers/);

    await userEvent.click(
      within(card).getByTestId("splits-view-picker-toggle"),
    );
    await userEvent.click(within(card).getByTestId("splits-view-option-miles"));

    await waitFor(() => {
      expect(
        within(card).getByTestId("summary-splits-heading"),
      ).toHaveTextContent(/Splits in Miles/);
    });
  });

  it("summary split selection does not leak back to the normal splits panel", async () => {
    render(<App />);

    const card = await openSummary();
    await userEvent.click(
      within(card).getByTestId("splits-view-picker-toggle"),
    );
    await userEvent.click(within(card).getByTestId("splits-view-option-miles"));

    await userEvent.click(screen.getByTestId("summary-close"));
    expect(await screen.findByAltText("Pacerly logo")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Splits"));
    const splitRows = within(screen.getByTestId("card-splits")).getAllByRole(
      "row",
    );
    expect(within(splitRows[1]).getByText("1K")).toBeInTheDocument();
  });
});
