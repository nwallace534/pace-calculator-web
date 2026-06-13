// Unit-test exception (per testing-approach memory): summaryRows.ts is a pure
// helper module. Exercising its tier/threshold branches per-event through the
// browser would be slow and offers no signal the screenshot script doesn't
// already cover.

import { describe, expect, it } from "vitest";
import { DistanceUnit } from "pace-calculator";
import {
  buildIntervalRows,
  buildSummaryPredictionRows,
  formatFriendlyTimeExact,
} from "@/modules/summaryRows";

const time = (hours: number, minutes: number, seconds: number, ms = 0) => ({
  hours,
  minutes,
  seconds,
  milliseconds: ms,
});

const TIME_EMPTY = {
  timeHours: "0",
  timeMinutes: "0",
  timeSeconds: "0",
  timeHundredths: "0",
};

const distanceParams = (
  whole: string,
  unit: DistanceUnit,
  fractional = "0",
) => ({
  distanceWhole: whole,
  distanceFractional: fractional,
  distanceUnit: unit,
});

describe("formatFriendlyTimeExact", () => {
  it("renders minutes + seconds (no hours) when the time is under an hour", () => {
    expect(formatFriendlyTimeExact(time(0, 5, 30))).toBe("5m 30s");
  });

  it("zero-pads seconds to 'NNs' only when seconds equal zero (kept literal so '5m' reads as 'exactly 5 minutes')", () => {
    expect(formatFriendlyTimeExact(time(0, 5, 0))).toBe("5m 00s");
  });

  it("renders h + m + s when the time crosses an hour", () => {
    expect(formatFriendlyTimeExact(time(2, 59, 59))).toBe("2h 59m 59s");
  });

  it("keeps the '00m' middle slot when minutes are exactly zero in an hour-plus time", () => {
    // "1h 30s" would lose the minute slot and read as a typo.
    expect(formatFriendlyTimeExact(time(1, 0, 30))).toBe("1h 00m 30s");
  });

  it("renders just 'Xs' when the time is sub-minute and showHundredths is off", () => {
    expect(formatFriendlyTimeExact(time(0, 0, 45))).toBe("45s");
  });

  it("renders the seconds as track-timing decimals when showHundredths is on (e.g. 100m sprint)", () => {
    // 9.58s 100m: zero-padded NOT (sub-minute, no preceding part), hundredths
    // tacked on as ".58s".
    expect(formatFriendlyTimeExact(time(0, 0, 9, 580), true)).toBe("9.58s");
  });

  it("renders 'Mm SS.HHs' when minutes are present and showHundredths is on (800m WR shape)", () => {
    // Kratochvílová's 800m: 1m 53.28s — seconds pad to two digits because a
    // preceding minutes slot is present.
    expect(formatFriendlyTimeExact(time(0, 1, 53, 280), true)).toBe(
      "1m 53.28s",
    );
  });

  it("truncates sub-10ms precision rather than rounding (matches predictions which carry only full-ms times)", () => {
    // 9.589s → hundredths = floor(589/10) = 58, so "9.58s" not "9.59s".
    expect(formatFriendlyTimeExact(time(0, 0, 9, 589), true)).toBe("9.58s");
  });
});

describe("buildSummaryPredictionRows — tier matrix", () => {
  it("returns nothing in the middle range (3K < goal < 10K, including a 5K)", () => {
    // 5K @ 25:00 — middle range floor.
    expect(
      buildSummaryPredictionRows({
        ...distanceParams("5", DistanceUnit.Kilometers),
        timeHours: "0",
        timeMinutes: "25",
        timeSeconds: "0",
        timeHundredths: "0",
      }),
    ).toEqual([]);

    // 4K @ 18:00 — Custom road in the middle.
    expect(
      buildSummaryPredictionRows({
        ...distanceParams("4", DistanceUnit.Kilometers),
        timeHours: "0",
        timeMinutes: "18",
        timeSeconds: "0",
        timeHundredths: "0",
      }),
    ).toEqual([]);
  });

  it("returns nothing for 800m (short tier, but the only ≥800m TimesForPace event below 800m is itself)", () => {
    expect(
      buildSummaryPredictionRows({
        ...distanceParams("800", DistanceUnit.Meters),
        timeHours: "0",
        timeMinutes: "2",
        timeSeconds: "0",
        timeHundredths: "0",
      }),
    ).toEqual([]);
  });

  it("short tier — 1500m goal predicts 800m", () => {
    const rows = buildSummaryPredictionRows({
      ...distanceParams("1500", DistanceUnit.Meters),
      timeHours: "0",
      timeMinutes: "5",
      timeSeconds: "0",
      timeHundredths: "0",
    });
    expect(rows.map((r) => r.id)).toEqual(["eightHundredMeters"]);
  });

  it("short tier — 3000m goal predicts 800m and 1500m, ascending", () => {
    const rows = buildSummaryPredictionRows({
      ...distanceParams("3", DistanceUnit.Kilometers),
      timeHours: "0",
      timeMinutes: "12",
      timeSeconds: "0",
      timeHundredths: "0",
    });
    expect(rows.map((r) => r.id)).toEqual([
      "eightHundredMeters",
      "fifteenHundredMeters",
    ]);
  });

  it("long tier — 10K goal predicts the 5K only", () => {
    const rows = buildSummaryPredictionRows({
      ...distanceParams("10", DistanceUnit.Kilometers),
      timeHours: "0",
      timeMinutes: "45",
      timeSeconds: "0",
      timeHundredths: "0",
    });
    expect(rows.map((r) => r.id)).toEqual(["fiveK"]);
  });

  it("long tier — half marathon goal predicts the 5K and 10K", () => {
    const rows = buildSummaryPredictionRows({
      ...distanceParams("13", DistanceUnit.Miles, "1"),
      timeHours: "1",
      timeMinutes: "45",
      timeSeconds: "0",
      timeHundredths: "0",
    });
    expect(rows.map((r) => r.id)).toEqual(["fiveK", "tenK"]);
  });

  it("long tier — marathon goal predicts 5K, 10K, half marathon (ascending, never itself)", () => {
    const rows = buildSummaryPredictionRows({
      ...distanceParams("26", DistanceUnit.Miles, "2"),
      timeHours: "3",
      timeMinutes: "30",
      timeSeconds: "0",
      timeHundredths: "0",
    });
    expect(rows.map((r) => r.id)).toEqual(["fiveK", "tenK", "halfMarathon"]);
    expect(rows.some((r) => r.id === "marathon")).toBe(false);
  });

  it("returns nothing when the goal time is empty (predictRaceTime → null → filtered out)", () => {
    expect(
      buildSummaryPredictionRows({
        ...distanceParams("26", DistanceUnit.Miles, "2"),
        ...TIME_EMPTY,
      }),
    ).toEqual([]);
  });

  it("produces real prediction Time objects, not nulls or wrappers", () => {
    // Pinning the Riegel output for a known case: 1500m @ 5:00 → 800m
    // prediction. Riegel: 5:00 × (800/1500)^1.06 ≈ 2:34.
    const rows = buildSummaryPredictionRows({
      ...distanceParams("1500", DistanceUnit.Meters),
      timeHours: "0",
      timeMinutes: "5",
      timeSeconds: "0",
      timeHundredths: "0",
    });
    expect(rows).toHaveLength(1);
    const t = rows[0].time;
    expect(t.hours).toBe(0);
    expect(t.minutes).toBe(2);
    // Allow a couple of ms either side for floating-point drift.
    expect(t.seconds).toBeGreaterThanOrEqual(33);
    expect(t.seconds).toBeLessThanOrEqual(35);
  });
});

describe("buildIntervalRows", () => {
  const PACE_6_PER_KM = {
    perKilometer: { hours: 0, minutes: 6, seconds: 0, milliseconds: 0 },
    perMile: { hours: 0, minutes: 9, seconds: 39, milliseconds: 0 },
    speedKph: 10,
    speedMph: 6.21,
  };

  it("returns nothing when paceResults is null (calculation hasn't run)", () => {
    expect(
      buildIntervalRows({
        paceResults: null,
        ...distanceParams("5", DistanceUnit.Kilometers),
      }),
    ).toEqual([]);
  });

  it("returns nothing for a zero-length input distance", () => {
    expect(
      buildIntervalRows({
        paceResults: PACE_6_PER_KM,
        ...distanceParams("0", DistanceUnit.Kilometers),
      }),
    ).toEqual([]);
  });

  it("returns nothing for goals at or under 400m (splits already show 100m/200m landmarks)", () => {
    expect(
      buildIntervalRows({
        paceResults: PACE_6_PER_KM,
        ...distanceParams("400", DistanceUnit.Meters),
      }),
    ).toEqual([]);
    expect(
      buildIntervalRows({
        paceResults: PACE_6_PER_KM,
        ...distanceParams("200", DistanceUnit.Meters),
      }),
    ).toEqual([]);
  });

  it("keeps the sprint references (100m, 200m) for sub-5K goals — they're meaningful at middle-distance pace", () => {
    // 1500m goal: full ladder up to <1500m.
    const rows = buildIntervalRows({
      paceResults: PACE_6_PER_KM,
      ...distanceParams("1500", DistanceUnit.Meters),
    });
    expect(rows.map((r) => r.label)).toEqual([
      "100m",
      "200m",
      "400m",
      "800m",
      "1km",
    ]);

    // 3000m goal: ladder extends one rung further to include 1mi.
    const threeK = buildIntervalRows({
      paceResults: PACE_6_PER_KM,
      ...distanceParams("3", DistanceUnit.Kilometers),
    });
    expect(threeK.map((r) => r.label)).toEqual([
      "100m",
      "200m",
      "400m",
      "800m",
      "1km",
      "1mi",
    ]);
  });

  it("drops the sprint references for endurance goals (≥ 5K) — 400m is the natural floor there", () => {
    const fiveK = buildIntervalRows({
      paceResults: PACE_6_PER_KM,
      ...distanceParams("5", DistanceUnit.Kilometers),
    });
    expect(fiveK.map((r) => r.label)).toEqual([
      "400m",
      "800m",
      "1km",
      "1mi",
      "3000m",
    ]);
    expect(fiveK.some((r) => r.label === "100m")).toBe(false);
    expect(fiveK.some((r) => r.label === "200m")).toBe(false);
  });

  it("lights up the full ladder (minus sprints) for a marathon goal", () => {
    const rows = buildIntervalRows({
      paceResults: PACE_6_PER_KM,
      ...distanceParams("26", DistanceUnit.Miles, "2"),
    });
    expect(rows.map((r) => r.label)).toEqual([
      "400m",
      "800m",
      "1km",
      "1mi",
      "3000m",
      "5K",
      "10K",
      "1/2 Mar",
    ]);
  });

  it("computes interval times by applying ms-per-meter from per-km pace", () => {
    // 6:00/km → 360 ms/m. 400m × 360 = 144,000 ms = 2:24.
    const rows = buildIntervalRows({
      paceResults: PACE_6_PER_KM,
      ...distanceParams("5", DistanceUnit.Kilometers),
    });
    const fourHundred = rows.find((r) => r.label === "400m")!;
    expect(fourHundred.time).toEqual({
      hours: 0,
      minutes: 2,
      seconds: 24,
      milliseconds: 0,
    });
    const oneKm = rows.find((r) => r.label === "1km")!;
    expect(oneKm.time).toEqual({
      hours: 0,
      minutes: 6,
      seconds: 0,
      milliseconds: 0,
    });
  });
});
