import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DistanceUnit } from "pace-calculator";
import App from "@/App";
import {
  applySharedTarget,
  buildShareUrl,
  parseSharedTarget,
} from "@/utils/shareTarget";
import { DistanceMode } from "@/types/distance";
import useCalculatorStore from "@/state/useCalculatorStore";

const fakeLocation = (path = "/"): Location =>
  ({
    origin: "https://pacerly.com",
    pathname: path,
  }) as Location;

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

describe("parseSharedTarget — summary-view options", () => {
  it("reads view=summary off the URL", () => {
    const target = parseSharedTarget("?event=fiveK&m=20&view=summary");
    expect(target?.view).toBe("summary");
  });

  it("reads from=share off the URL", () => {
    const target = parseSharedTarget("?event=fiveK&m=20&from=share");
    expect(target?.fromShare).toBe(true);
  });

  it("treats unrecognised view values as undefined", () => {
    // Defensive: only "summary" is a valid view; anything else (an old or
    // mistyped link) should fall through to the plain calculator.
    const target = parseSharedTarget("?event=fiveK&m=20&view=garbage");
    expect(target?.view).toBeUndefined();
  });

  it("treats from values other than 'share' as not-from-share", () => {
    const target = parseSharedTarget("?event=fiveK&m=20&from=email");
    expect(target?.fromShare).toBe(false);
  });
});

describe("buildShareUrl — summary-view options", () => {
  // Seed the store with a known target so the URL params are predictable.
  const seedFiveK = () => {
    const store = useCalculatorStore.getState();
    store.setEvent("fiveK");
    store.setFullTime("0", "20", "0", "0");
  };

  it("omits view + from params when no options are passed", () => {
    seedFiveK();
    const url = buildShareUrl(useCalculatorStore.getState(), fakeLocation());
    expect(url).toBe("https://pacerly.com/?event=fiveK&m=20");
  });

  it("adds view=summary when options.view is set", () => {
    seedFiveK();
    const url = buildShareUrl(useCalculatorStore.getState(), fakeLocation(), {
      view: "summary",
    });
    expect(url).toContain("view=summary");
    expect(url).not.toContain("from=share");
  });

  it("adds from=share when options.fromShare is true", () => {
    seedFiveK();
    const url = buildShareUrl(useCalculatorStore.getState(), fakeLocation(), {
      fromShare: true,
    });
    expect(url).toContain("from=share");
    expect(url).not.toContain("view=");
  });

  it("emits both view=summary and from=share when both options are set (the canonical 'share goal summary' link)", () => {
    seedFiveK();
    const url = buildShareUrl(useCalculatorStore.getState(), fakeLocation(), {
      view: "summary",
      fromShare: true,
    });
    expect(url).toContain("view=summary");
    expect(url).toContain("from=share");
  });
});

describe("applySharedTarget — view / fromShare routing into the store", () => {
  // Build a fresh SharedTarget locally rather than round-tripping through
  // parseSharedTarget — the parse path is already covered above, and these
  // tests are about what applySharedTarget does *with* the parsed value.
  const fiveKTarget = (
    overrides: Partial<{
      view: "summary" | undefined;
      fromShare: boolean;
    }> = {},
  ) => ({
    event: "fiveK",
    timeHours: "0",
    timeMinutes: "20",
    timeSeconds: "0",
    timeHundredths: "0",
    view: undefined as "summary" | undefined,
    fromShare: false,
    ...overrides,
  });

  it("does NOT open the summary view when target.view is absent", () => {
    expect(useCalculatorStore.getState().summaryViewOpen).toBe(false);
    applySharedTarget(fiveKTarget(), useCalculatorStore.getState());
    expect(useCalculatorStore.getState().summaryViewOpen).toBe(false);
    expect(useCalculatorStore.getState().summaryArrivedFromShare).toBe(false);
  });

  it("opens the summary view (plain path) when view=summary without fromShare", () => {
    applySharedTarget(
      fiveKTarget({ view: "summary" }),
      useCalculatorStore.getState(),
    );
    expect(useCalculatorStore.getState().summaryViewOpen).toBe(true);
    // No share-orientation flag for the non-from-share path.
    expect(useCalculatorStore.getState().summaryArrivedFromShare).toBe(false);
  });

  it("opens the summary view via the from-share path when both view=summary and fromShare are set", () => {
    applySharedTarget(
      fiveKTarget({ view: "summary", fromShare: true }),
      useCalculatorStore.getState(),
    );
    expect(useCalculatorStore.getState().summaryViewOpen).toBe(true);
    expect(useCalculatorStore.getState().summaryArrivedFromShare).toBe(true);
  });

  it("still applies the time/event fields even when not opening the summary", () => {
    // The view flag only controls auto-opening — the rest of the target
    // still needs to populate the inputs.
    applySharedTarget(
      fiveKTarget({ view: undefined }),
      useCalculatorStore.getState(),
    );
    expect(useCalculatorStore.getState().event).toBe("fiveK");
    expect(useCalculatorStore.getState().timeMinutes).toBe("20");
  });
});
