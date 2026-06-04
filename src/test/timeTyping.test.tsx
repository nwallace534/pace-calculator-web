import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "vitest/browser";
import App from "@/App";
import { clearTimeFields, selectEvent, typeChars } from "./helpers";

describe("Time field typing — auto-advance and skip-char chains", () => {
  describe("Marathon (hours / minutes / seconds)", () => {
    it("auto-advances through hours → minutes → seconds after 2 digits", async () => {
      render(<App />);
      await selectEvent("marathon");
      await clearTimeFields("hours", "minutes", "seconds");

      await userEvent.click(screen.getByLabelText("hours"));
      await typeChars("025959");

      expect(screen.getByLabelText("hours")).toHaveValue("02");
      expect(screen.getByLabelText("minutes")).toHaveValue("59");
      expect(screen.getByLabelText("seconds")).toHaveValue("59");
    });

    it("dot acts as a skip char — '2.59.59' lands as 02:59:59", async () => {
      render(<App />);
      await selectEvent("marathon");
      await clearTimeFields("hours", "minutes", "seconds");

      await userEvent.click(screen.getByLabelText("hours"));
      await typeChars("2.59.59");

      expect(screen.getByLabelText("hours")).toHaveValue("02");
      expect(screen.getByLabelText("minutes")).toHaveValue("59");
      expect(screen.getByLabelText("seconds")).toHaveValue("59");
    });
  });

  describe("800m (minutes / seconds / hundredths)", () => {
    it("auto-advances through minutes → seconds → hundredths after 2 digits", async () => {
      render(<App />);
      await selectEvent("eightHundredMeters");
      await clearTimeFields("minutes", "seconds", "hundredths");

      await userEvent.click(screen.getByLabelText("minutes"));
      await typeChars("025999");

      expect(screen.getByLabelText("minutes")).toHaveValue("02");
      expect(screen.getByLabelText("seconds")).toHaveValue("59");
      expect(screen.getByLabelText("hundredths")).toHaveValue("99");
    });

    it("dot skips through all three fields — '2.59.99' lands as 02:59.99", async () => {
      render(<App />);
      await selectEvent("eightHundredMeters");
      await clearTimeFields("minutes", "seconds", "hundredths");

      await userEvent.click(screen.getByLabelText("minutes"));
      await typeChars("2.59.99");

      expect(screen.getByLabelText("minutes")).toHaveValue("02");
      expect(screen.getByLabelText("seconds")).toHaveValue("59");
      expect(screen.getByLabelText("hundredths")).toHaveValue("99");
    });
  });

  describe("100m (seconds / hundredths — minutes hidden)", () => {
    it("auto-advances seconds → hundredths after 2 digits", async () => {
      render(<App />);
      await selectEvent("oneHundredMeters");
      await clearTimeFields("seconds", "hundredths");

      await userEvent.click(screen.getByLabelText("seconds"));
      await typeChars("1099");

      expect(screen.getByLabelText("seconds")).toHaveValue("10");
      expect(screen.getByLabelText("hundredths")).toHaveValue("99");
    });

    it("dot skips seconds → hundredths — '9.99' lands as 09.99", async () => {
      render(<App />);
      await selectEvent("oneHundredMeters");
      await clearTimeFields("seconds", "hundredths");

      await userEvent.click(screen.getByLabelText("seconds"));
      await typeChars("9.99");

      expect(screen.getByLabelText("seconds")).toHaveValue("09");
      expect(screen.getByLabelText("hundredths")).toHaveValue("99");
    });
  });

  describe("Field value clamping", () => {
    it("hours accepts 99 (its max)", async () => {
      render(<App />);
      await selectEvent("marathon");
      await userEvent.fill(screen.getByLabelText("hours"), "99");
      expect(screen.getByLabelText("hours")).toHaveValue("99");
    });

    it("hours clamps values over 99 down to 99", async () => {
      render(<App />);
      await selectEvent("marathon");
      await userEvent.fill(screen.getByLabelText("hours"), "100");
      expect(screen.getByLabelText("hours")).toHaveValue("99");
    });

    it("minutes clamps values over 59 down to 59", async () => {
      render(<App />);
      await userEvent.fill(screen.getByLabelText("minutes"), "99");
      expect(screen.getByLabelText("minutes")).toHaveValue("59");
    });

    it("seconds clamps values over 59 down to 59", async () => {
      render(<App />);
      await userEvent.fill(screen.getByLabelText("seconds"), "99");
      expect(screen.getByLabelText("seconds")).toHaveValue("59");
    });

    it("hundredths accepts 99 (its max)", async () => {
      render(<App />);
      await selectEvent("eightHundredMeters");
      await userEvent.fill(screen.getByLabelText("hundredths"), "99");
      expect(screen.getByLabelText("hundredths")).toHaveValue("99");
    });
  });
});
