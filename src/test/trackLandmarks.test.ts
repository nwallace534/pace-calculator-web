// Unit-test exception (per testing-approach memory): getEventLandmarks is a
// pure function with many event-specific branches (sprints vs middle distance
// vs custom-track sub-400m vs mile-style trailing). The branch matrix is
// exactly what unit tests catch cleanly; browser/screenshot coverage would
// duplicate without adding signal.

import { describe, expect, it } from "vitest";
import { getEventLandmarks } from "@/utils/events";
import { DistanceMode } from "@/types/distance";

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
