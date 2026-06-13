import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DistanceUnit } from "pace-calculator";
import App from "@/App";
import { parseSharedTarget } from "@/utils/shareTarget";
import { DistanceMode } from "@/types/distance";

describe("share target URLs", () => {
  it("parses a minimal custom-distance URL with only non-zero time fields", () => {
    const target = parseSharedTarget(
      "?event=Custom&dw=7&df=125&unit=Kilometers&m=35&s=10&cs=5",
    );

    expect(target).toEqual({
      event: DistanceMode.Custom,
      distanceWhole: "7",
      distanceFractional: "125",
      distanceUnit: DistanceUnit.Kilometers,
      timeHours: "00",
      timeMinutes: "35",
      timeSeconds: "10",
      timeHundredths: "05",
      view: undefined,
      fromShare: false,
    });
  });

  it("defaults missing shared time fields to zero", () => {
    const target = parseSharedTarget("?event=fiveK&m=20");

    expect(target).toEqual({
      event: "fiveK",
      timeHours: "00",
      timeMinutes: "20",
      timeSeconds: "00",
      timeHundredths: "00",
      view: undefined,
      fromShare: false,
    });
  });

  it("still parses URLs that include explicit zero time params", () => {
    const target = parseSharedTarget("?event=fiveK&h=0&m=20&s=0&cs=0");

    expect(target).toEqual({
      event: "fiveK",
      timeHours: "00",
      timeMinutes: "20",
      timeSeconds: "00",
      timeHundredths: "00",
      view: undefined,
      fromShare: false,
    });
  });

  it("loads a shared event target into the inputs", async () => {
    window.history.pushState(null, "", "/?event=fiveK&m=20");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText("minutes")).toHaveValue("20");
    });
  });

  it("loads a shared custom road target", async () => {
    window.history.pushState(
      null,
      "",
      "/?event=Custom&dw=7&df=125&unit=Kilometers&m=35&s=10",
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText("Selected run distance")).toHaveValue(
        DistanceMode.Custom,
      );
    });
    expect(screen.getByDisplayValue("7")).toBeInTheDocument();
    expect(screen.getByDisplayValue("125")).toBeInTheDocument();
    expect(screen.getByLabelText("minutes")).toHaveValue("35");
  });
});
