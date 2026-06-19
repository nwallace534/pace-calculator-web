// Unit-test exception (per testing-approach memory): the trackSummary derivation
// inside getCalculationUpdate is a pure function with branchy event-specific
// logic (mile vs middle distance vs custom-track sub-400m vs sub-100m trailing).
// The branch matrix is exactly what unit tests catch cleanly; browser/screenshot
// coverage would duplicate without adding signal.

import { describe, expect, it } from "vitest";
import { DistanceUnit } from "pace-calculator";
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
  event: "fiveK",
  savedDistances: [],
  ...overrides,
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
