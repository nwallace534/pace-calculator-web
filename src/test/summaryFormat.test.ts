// Unit-test exception (per testing-approach memory): summaryFormat.ts is a
// pure helper module with no DOM, store, or i18n surface.

import { describe, expect, it } from "vitest";
import { DistanceUnit } from "pace-calculator";
import { buildDistanceLine, formatSplitLabel } from "@/modules/summaryFormat";

describe("buildDistanceLine", () => {
  it("renders 'X mi = Y km' (both at 2dp) for miles-unit events", () => {
    // Marathon catalog value: 26.218 mi → 42.19 km (26.218 × 1.609344).
    expect(
      buildDistanceLine({
        distanceWhole: "26",
        distanceFractional: "218",
        distanceUnit: DistanceUnit.Miles,
      }),
    ).toBe("26.22 miles = 42.19 km");

    // Round number — still 2dp on both sides for the precision-vs-rounding
    // promise (see PaceResult comment).
    expect(
      buildDistanceLine({
        distanceWhole: "1",
        distanceFractional: "0",
        distanceUnit: DistanceUnit.Miles,
      }),
    ).toBe("1.00 miles = 1.61 km");
  });

  it("renders just the imperial equivalent for km-unit events", () => {
    // 5 km → 3.11 miles.
    expect(
      buildDistanceLine({
        distanceWhole: "5",
        distanceFractional: "0",
        distanceUnit: DistanceUnit.Kilometers,
      }),
    ).toBe("3.11 miles");

    // 10 km → 6.21 miles.
    expect(
      buildDistanceLine({
        distanceWhole: "10",
        distanceFractional: "0",
        distanceUnit: DistanceUnit.Kilometers,
      }),
    ).toBe("6.21 miles");
  });

  it("renders just the imperial equivalent for meters-unit events", () => {
    // 5000m → 3.11 miles, same as 5km.
    expect(
      buildDistanceLine({
        distanceWhole: "5000",
        distanceFractional: "0",
        distanceUnit: DistanceUnit.Meters,
      }),
    ).toBe("3.11 miles");

    // 800m → 0.50 miles.
    expect(
      buildDistanceLine({
        distanceWhole: "800",
        distanceFractional: "0",
        distanceUnit: DistanceUnit.Meters,
      }),
    ).toBe("0.50 miles");
  });
});

describe("formatSplitLabel", () => {
  it("renders the cumulative meter landmark for meter-unit splits", () => {
    // Track events use the landmark itself ("300", "700") since the number
    // carries pacing meaning.
    expect(formatSplitLabel(DistanceUnit.Meters, 300, 1)).toBe("300");
    expect(formatSplitLabel(DistanceUnit.Meters, 700, 2)).toBe("700");
    // Trailing partials (e.g. mile's 1609.344m).
    expect(formatSplitLabel(DistanceUnit.Meters, 1609.344, 5)).toBe("1609.344");
  });

  it("renders the integer split number for whole-distance road splits", () => {
    // Road km/miles: per-row distance equals the split number when the value
    // is a clean integer, so we use the number itself (unit is in the heading).
    expect(formatSplitLabel(DistanceUnit.Kilometers, 1, 1)).toBe("1");
    expect(formatSplitLabel(DistanceUnit.Kilometers, 5, 5)).toBe("5");
    expect(formatSplitLabel(DistanceUnit.Miles, 26, 26)).toBe("26");
  });

  it("renders a 2dp fractional distance for the partial tail row", () => {
    // 5K with km splits has a clean 5.0 last row — handled by the integer
    // branch. But 26.2-mile marathon has a 26.20 tail past the integer 26.
    expect(formatSplitLabel(DistanceUnit.Miles, 26.2, 27)).toBe("26.20");
    // 5.5K road with km splits would tail at 5.50.
    expect(formatSplitLabel(DistanceUnit.Kilometers, 5.5, 6)).toBe("5.50");
  });

  it("falls back to the integer/fractional rule when the unit is undefined", () => {
    // Defensive — splits.unit can be undefined while data is settling. The
    // function should still produce a usable label rather than throwing.
    expect(formatSplitLabel(undefined, 5, 5)).toBe("5");
    expect(formatSplitLabel(undefined, 5.5, 6)).toBe("5.50");
  });
});
