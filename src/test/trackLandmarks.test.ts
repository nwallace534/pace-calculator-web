// Unit-test exception (per testing-approach memory): getEventLandmarks and the
// trackSummary builder inside getCalculationUpdate are pure functions with
// many event-specific branches (mile vs middle distance vs custom-track
// sub-400m vs sub-100m trailing). The branch matrix is exactly what unit
// tests catch cleanly; browser/screenshot coverage would duplicate without
// adding signal.

import { describe, expect, it } from "vitest";
import { DistanceUnit } from "pace-calculator";
import { getEventLandmarks } from "@/utils/events";
import { ComputeMode, getCalculationUpdate } from "@/utils/calculator";
import { DistanceMode } from "@/types/distance";
import type { CalculatorInputSubset } from "@/types/calculatorInput";

const baseInput = (
  overrides: Partial<CalculatorInputSubset> = {},
): CalculatorInputSubset => ({
  distanceWhole: "0",
  distanceFractional: "0",
  distanceUnit: DistanceUnit.Meters,
  timeHours: "0",
  timeMinutes: "0",
  timeSeconds: "0",
  timeHundredths: "0",
  showSplits: true,
  showTimesForPace: false,
  computeMode: ComputeMode.Pace,
  splitsUnit: null,
  event: "fiveK",
  savedDistances: [],
  ...overrides,
});

describe("getEventLandmarks — track-style cumulative landmarks per event", () => {
  it("returns null for road events (no track-style landmarks apply)", () => {
    expect(getEventLandmarks("fiveK", 5000)).toBeNull();
    expect(getEventLandmarks("tenK", 10000)).toBeNull();
    expect(getEventLandmarks("halfMarathon", 21097)).toBeNull();
    expect(getEventLandmarks("marathon", 42164)).toBeNull();
  });

  it("returns null for Custom (road) and for zero/negative distances", () => {
    expect(getEventLandmarks(DistanceMode.Custom, 5000)).toBeNull();
    expect(getEventLandmarks("fiveK", 0)).toBeNull();
    expect(getEventLandmarks("fiveK", -1)).toBeNull();
  });

  it("paces sprints (100m / 200m / 400m) in 100m segments", () => {
    expect(getEventLandmarks("oneHundredMeters", 100)).toEqual([100]);
    expect(getEventLandmarks("twoHundredMeters", 200)).toEqual([100, 200]);
    expect(getEventLandmarks("fourHundredMeters", 400)).toEqual([
      100, 200, 300, 400,
    ]);
  });

  it("paces 800m as clean 400m laps", () => {
    expect(getEventLandmarks("eightHundredMeters", 800)).toEqual([400, 800]);
  });

  it("paces 1500m as a 300m opener followed by 3 × 400m laps", () => {
    expect(getEventLandmarks("fifteenHundredMeters", 1500)).toEqual([
      300, 700, 1100, 1500,
    ]);
  });

  it("paces 3000m as a 200m opener followed by 7 × 400m laps", () => {
    expect(getEventLandmarks("threeThousandMeters", 3000)).toEqual([
      200, 600, 1000, 1400, 1800, 2200, 2600, 3000,
    ]);
  });

  it("paces the mile (1609.344m, remainder 9.344 < 100) as 4 × 400m laps + a trailing partial — no 9m opener", () => {
    expect(getEventLandmarks("mile", 1609.344)).toEqual([
      400, 800, 1200, 1600, 1609.344,
    ]);
  });

  it("paces sub-400m custom-track distances in 100m intervals with the remainder trailing", () => {
    // 250m: 100m, 200m, then the leftover 50m on the end (not a 50m opener).
    expect(getEventLandmarks(DistanceMode.CustomTrack, 250)).toEqual([
      100, 200, 250,
    ]);
    // Clean 300m.
    expect(getEventLandmarks(DistanceMode.CustomTrack, 300)).toEqual([
      100, 200, 300,
    ]);
    // 150m: just 100m + trailing 50m.
    expect(getEventLandmarks(DistanceMode.CustomTrack, 150)).toEqual([
      100, 150,
    ]);
  });

  it("paces 400m+ custom-track distances in 400m laps with a real opener (when remainder ≥ 100)", () => {
    // 500m: 100m opener + 400m lap. (Remainder 100 isn't < 100, so no flip.)
    expect(getEventLandmarks(DistanceMode.CustomTrack, 500)).toEqual([
      100, 500,
    ]);
    // 1200m: clean 3 × 400m.
    expect(getEventLandmarks(DistanceMode.CustomTrack, 1200)).toEqual([
      400, 800, 1200,
    ]);
    // 1500m via custom track lines up with the catalog 1500m event.
    expect(getEventLandmarks(DistanceMode.CustomTrack, 1500)).toEqual([
      300, 700, 1100, 1500,
    ]);
  });

  it("flips a 400m+ custom-track distance with sub-100m remainder to trailing layout (mile-style)", () => {
    // 1609m: 4 × 400m + a 9m trailing partial — same shape as the mile.
    expect(getEventLandmarks(DistanceMode.CustomTrack, 1609)).toEqual([
      400, 800, 1200, 1600, 1609,
    ]);
    // 2407m: 6 × 400m + 7m trailing.
    expect(getEventLandmarks(DistanceMode.CustomTrack, 2407)).toEqual([
      400, 800, 1200, 1600, 2000, 2400, 2407,
    ]);
  });
});

describe("getCalculationUpdate — trackSummary for track-style events", () => {
  it("leaves trackSummary null for road events", () => {
    // 5K @ 25:00.
    const { splits } = getCalculationUpdate(
      baseInput({
        event: "fiveK",
        distanceWhole: "5",
        distanceUnit: DistanceUnit.Kilometers,
        timeMinutes: "25",
      }),
    );
    expect(splits?.trackSummary).toBeNull();
  });

  it("leaves trackSummary null when the splits are sub-400m (sprints / short custom-track)", () => {
    // 100m @ 12.00s — single split, can't summarise.
    const oneHundred = getCalculationUpdate(
      baseInput({
        event: "oneHundredMeters",
        distanceWhole: "100",
        distanceUnit: DistanceUnit.Meters,
        timeSeconds: "12",
        timeHundredths: "0",
      }),
    );
    expect(oneHundred.splits?.trackSummary).toBeNull();

    // 200m @ 25s — two splits but under the 400m threshold the summary doesn't
    // try to frame as "opener + laps".
    const twoHundred = getCalculationUpdate(
      baseInput({
        event: "twoHundredMeters",
        distanceWhole: "200",
        distanceUnit: DistanceUnit.Meters,
        timeSeconds: "25",
      }),
    );
    expect(twoHundred.splits?.trackSummary).toBeNull();

    // Custom-track 250m @ 50s — also sub-400m.
    const custom250 = getCalculationUpdate(
      baseInput({
        event: DistanceMode.CustomTrack,
        distanceWhole: "250",
        distanceUnit: DistanceUnit.Meters,
        timeSeconds: "50",
      }),
    );
    expect(custom250.splits?.trackSummary).toBeNull();
  });

  it("leaves trackSummary null for clean uniform-lap sequences (e.g. 800m, 400m sprint, custom-track 1200m)", () => {
    // 400m @ 60s — 100m intervals throughout, no opener / no trailing.
    const fourHundred = getCalculationUpdate(
      baseInput({
        event: "fourHundredMeters",
        distanceWhole: "400",
        distanceUnit: DistanceUnit.Meters,
        timeMinutes: "1",
      }),
    );
    expect(fourHundred.splits?.trackSummary).toBeNull();

    // 800m @ 2:30 — 2 × 400m, totally uniform.
    const eightHundred = getCalculationUpdate(
      baseInput({
        event: "eightHundredMeters",
        distanceWhole: "800",
        distanceUnit: DistanceUnit.Meters,
        timeMinutes: "2",
        timeSeconds: "30",
      }),
    );
    expect(eightHundred.splits?.trackSummary).toBeNull();

    // Custom-track 1200m @ 4:00 — 3 × 400m laps.
    const custom1200 = getCalculationUpdate(
      baseInput({
        event: DistanceMode.CustomTrack,
        distanceWhole: "1200",
        distanceUnit: DistanceUnit.Meters,
        timeMinutes: "4",
      }),
    );
    expect(custom1200.splits?.trackSummary).toBeNull();
  });

  it("surfaces opening + lap for distances with a real opener (1500m, 3000m, custom-track 500m)", () => {
    // 1500m @ 5:00 — 300m opener + 3 × 400m laps. Goal pace 200ms/m →
    // opener 60s, lap 80s.
    const fifteenHundred = getCalculationUpdate(
      baseInput({
        event: "fifteenHundredMeters",
        distanceWhole: "1500",
        distanceUnit: DistanceUnit.Meters,
        timeMinutes: "5",
      }),
    );
    expect(fifteenHundred.splits?.trackSummary).toEqual({
      opening: 300,
      openingTime: { hours: 0, minutes: 1, seconds: 0, milliseconds: 0 },
      lap: 400,
      lapTime: { hours: 0, minutes: 1, seconds: 20, milliseconds: 0 },
    });

    // 3000m @ 12:00 — 200m opener + 7 × 400m laps. Goal pace 240ms/m →
    // opener 48s, lap 96s.
    const threeK = getCalculationUpdate(
      baseInput({
        event: "threeThousandMeters",
        distanceWhole: "3",
        distanceUnit: DistanceUnit.Kilometers,
        timeMinutes: "12",
      }),
    );
    expect(threeK.splits?.trackSummary).toEqual({
      opening: 200,
      openingTime: { hours: 0, minutes: 0, seconds: 48, milliseconds: 0 },
      lap: 400,
      lapTime: { hours: 0, minutes: 1, seconds: 36, milliseconds: 0 },
    });

    // Custom-track 500m @ 2:00 — 100m opener + 400m lap. Goal pace 240ms/m
    // → opener 24s, lap 96s.
    const custom500 = getCalculationUpdate(
      baseInput({
        event: DistanceMode.CustomTrack,
        distanceWhole: "500",
        distanceUnit: DistanceUnit.Meters,
        timeMinutes: "2",
      }),
    );
    expect(custom500.splits?.trackSummary).toEqual({
      opening: 100,
      openingTime: { hours: 0, minutes: 0, seconds: 24, milliseconds: 0 },
      lap: 400,
      lapTime: { hours: 0, minutes: 1, seconds: 36, milliseconds: 0 },
    });
  });

  it("surfaces laps-only (opening null) for the mile and custom-track distances with a sub-100m trailing partial", () => {
    // Mile @ 5:00 — 4 × 400m + 9.344m trailing. opening/openingTime stay null
    // so the renderer drops the "First Xm in Y · " prefix; lap = 400m,
    // lapTime ≈ 5:00 * 400 / 1609.344 ≈ 74.563s.
    const mile = getCalculationUpdate(
      baseInput({
        event: "mile",
        distanceWhole: "1",
        distanceUnit: DistanceUnit.Miles,
        timeMinutes: "5",
      }),
    );
    expect(mile.splits?.trackSummary).not.toBeNull();
    expect(mile.splits?.trackSummary?.opening).toBeNull();
    expect(mile.splits?.trackSummary?.openingTime).toBeNull();
    expect(mile.splits?.trackSummary?.lap).toBe(400);
    // 5:00 * 400 / 1609.344 = 74564.54ms → 1m 14s 564ms.
    expect(mile.splits?.trackSummary?.lapTime).toEqual({
      hours: 0,
      minutes: 1,
      seconds: 14,
      milliseconds: 564,
    });

    // Custom-track 1609m @ 5:00 — same shape as the mile (sub-100m trailing).
    const custom1609 = getCalculationUpdate(
      baseInput({
        event: DistanceMode.CustomTrack,
        distanceWhole: "1609",
        distanceUnit: DistanceUnit.Meters,
        timeMinutes: "5",
      }),
    );
    expect(custom1609.splits?.trackSummary).not.toBeNull();
    expect(custom1609.splits?.trackSummary?.opening).toBeNull();
    expect(custom1609.splits?.trackSummary?.openingTime).toBeNull();
    expect(custom1609.splits?.trackSummary?.lap).toBe(400);
  });
});
