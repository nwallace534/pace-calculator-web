import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";
import { selectEvent } from "./helpers";

// Custom-distance NumericInputs have no associated <label>; match by id, same
// approach as custom.test.tsx.
const customDistance = () =>
  document.getElementById("distance") as HTMLInputElement;

const WR_PACE_HINT = "Faster than world record pace.";

describe("World-record pace hint", () => {
  describe("Built-in event", () => {
    it("shows the unified copy when time beats the event's WR pace", async () => {
      render(<App />);
      // Default event is 5K. Men's 5K WR ≈ 12:35.36 → ~151.07 s/km.
      // 12:30 / 5km = 150 s/km, just under the floor.
      await userEvent.fill(screen.getByLabelText("minutes"), "12");
      await userEvent.fill(screen.getByLabelText("seconds"), "30");

      expect(await screen.findByText(WR_PACE_HINT)).toBeInTheDocument();
    });

    it("stays silent for an in-bounds time", async () => {
      render(<App />);
      // 13:00 / 5km = 156 s/km — slower than the WR floor.
      await userEvent.fill(screen.getByLabelText("minutes"), "13");
      await userEvent.fill(screen.getByLabelText("seconds"), "00");

      expect(screen.queryByText(WR_PACE_HINT)).toBeNull();
    });
  });

  describe("Custom (road) — bracketed distance", () => {
    it("warns at 4000 m when the time beats the 5000 m WR pace", async () => {
      // 4000 m has no exact catalog match and brackets 3000 m (~146.9 s/km)
      // and 5000 m (~151.1 s/km). Slower-of-neighbours floor = 5000 m's
      // pace, so 10:00 / 4 km (150 s/km) trips the warning. The old
      // nearest-by-delta logic resolved the tie to 3000 m's faster floor
      // and missed this case.
      render(<App />);
      await selectEvent("Custom");
      await userEvent.fill(customDistance(), "4");
      await userEvent.fill(screen.getByLabelText("minutes"), "10");
      await userEvent.fill(screen.getByLabelText("seconds"), "00");

      expect(await screen.findByText(WR_PACE_HINT)).toBeInTheDocument();
    });

    it("stays silent at 4000 m when the time is realistic", async () => {
      render(<App />);
      await selectEvent("Custom");
      await userEvent.fill(customDistance(), "4");
      // 11:00 / 4 km = 165 s/km, comfortably slower than either neighbour.
      await userEvent.fill(screen.getByLabelText("minutes"), "11");
      await userEvent.fill(screen.getByLabelText("seconds"), "00");

      expect(screen.queryByText(WR_PACE_HINT)).toBeNull();
    });
  });

  describe("Custom (road) — above the catalog maximum", () => {
    it("never warns for distances longer than the marathon", async () => {
      // 50 km has no upper-neighbour event, so the bracketing helper returns
      // null and the warning is suppressed — even when the entered time is
      // far faster than any human could sustain.
      render(<App />);
      await selectEvent("Custom");
      await userEvent.fill(customDistance(), "50");
      await userEvent.fill(screen.getByLabelText("hours"), "1");
      await userEvent.fill(screen.getByLabelText("minutes"), "0");
      await userEvent.fill(screen.getByLabelText("seconds"), "0");

      expect(screen.queryByText(WR_PACE_HINT)).toBeNull();
    });
  });

  describe("Custom (track) — below the catalog minimum", () => {
    it("warns when the pace beats the shortest catalog WR pace", async () => {
      // 25 m has no lower-neighbour; the shortest WR-bearing event (100 m
      // at ~95.8 s/km) acts as the single available floor. 25 m / 1.00 s =
      // 40 s/km is way under that floor.
      render(<App />);
      await selectEvent("CustomTrack");
      await userEvent.fill(customDistance(), "25");
      await userEvent.fill(screen.getByLabelText("seconds"), "1");

      expect(await screen.findByText(WR_PACE_HINT)).toBeInTheDocument();
    });
  });

  describe("Priority chain", () => {
    it("shows 'needs time' instead of the WR hint when time is empty", async () => {
      render(<App />);
      await selectEvent("Custom");
      await userEvent.fill(customDistance(), "3");
      // Time stays at 00:00:00 — the missing-time hint should win.

      expect(
        await screen.findByText("Enter a time to see your pace."),
      ).toBeInTheDocument();
      expect(screen.queryByText(WR_PACE_HINT)).toBeNull();
    });

    it("shows 'needs distance' instead of the WR hint when distance is empty", async () => {
      render(<App />);
      await selectEvent("Custom");
      await userEvent.fill(screen.getByLabelText("minutes"), "7");
      await userEvent.fill(screen.getByLabelText("seconds"), "30");

      expect(
        await screen.findByText("Enter a distance to see your pace."),
      ).toBeInTheDocument();
      expect(screen.queryByText(WR_PACE_HINT)).toBeNull();
    });
  });
});
