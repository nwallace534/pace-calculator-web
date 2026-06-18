// Unit-test exception (per testing-approach memory): splitsOverride.ts is a
// pure helper module — the disabled-rules matrix and smart-default matrix
// are exactly what unit tests catch cleanly. Browser coverage of every
// distance/unit combination would be slow and offers no signal a small
// table of expectations doesn't already give.

import { describe, expect, it } from "vitest";
import { DistanceUnit } from "pace-calculator";
import {
  SplitsOverrideOptions,
  getDefaultSplitsOption,
  getSplitsOptionDisabledReasonKey,
} from "@/utils/splitsOverride";

describe("getDefaultSplitsOption", () => {
  it("returns hundredMeters for sprint distances (≤400m), regardless of primary unit", () => {
    expect(getDefaultSplitsOption(100, DistanceUnit.Meters)).toBe(
      SplitsOverrideOptions.hundredMeters,
    );
    expect(getDefaultSplitsOption(400, DistanceUnit.Meters)).toBe(
      SplitsOverrideOptions.hundredMeters,
    );
  });

  it("returns laps when the primary splits are in meters (track-style events) above 400m", () => {
    // 800m, 1500m, mile, 3000m, even custom-track 5000m if entered as meters.
    expect(getDefaultSplitsOption(800, DistanceUnit.Meters)).toBe(
      SplitsOverrideOptions.laps,
    );
    expect(getDefaultSplitsOption(1500, DistanceUnit.Meters)).toBe(
      SplitsOverrideOptions.laps,
    );
    expect(getDefaultSplitsOption(3000, DistanceUnit.Meters)).toBe(
      SplitsOverrideOptions.laps,
    );
  });

  it("returns miles for road events entered in miles (marathon, half marathon)", () => {
    // Marathon: 42195m, primary unit Miles.
    expect(getDefaultSplitsOption(42195, DistanceUnit.Miles)).toBe(
      SplitsOverrideOptions.miles,
    );
    // Half marathon: 21097m, primary unit Miles.
    expect(getDefaultSplitsOption(21097, DistanceUnit.Miles)).toBe(
      SplitsOverrideOptions.miles,
    );
  });

  it("returns K for road events entered in km (5K, 10K)", () => {
    expect(getDefaultSplitsOption(5000, DistanceUnit.Kilometers)).toBe(
      SplitsOverrideOptions.K,
    );
    expect(getDefaultSplitsOption(10000, DistanceUnit.Kilometers)).toBe(
      SplitsOverrideOptions.K,
    );
  });

  it("falls back to laps when totalDistanceMeters is null (loading / no input yet)", () => {
    expect(getDefaultSplitsOption(null, DistanceUnit.Kilometers)).toBe(
      SplitsOverrideOptions.laps,
    );
    expect(getDefaultSplitsOption(null, undefined)).toBe(
      SplitsOverrideOptions.laps,
    );
  });
});

describe("getSplitsOptionDisabledReasonKey — laps", () => {
  const laps = SplitsOverrideOptions.laps;

  it("is disabled for sprints (≤400m)", () => {
    expect(
      getSplitsOptionDisabledReasonKey(laps, 400, DistanceUnit.Meters),
    ).toBe("calculator:result.splitsDisabled.lapsSprint");
    expect(
      getSplitsOptionDisabledReasonKey(laps, 100, DistanceUnit.Meters),
    ).toBe("calculator:result.splitsDisabled.lapsSprint");
  });

  it("is disabled for distances over 5K", () => {
    // Marathon distance.
    expect(
      getSplitsOptionDisabledReasonKey(laps, 42195, DistanceUnit.Miles),
    ).toBe("calculator:result.splitsDisabled.lapsLong");
    // Just over the 5K boundary.
    expect(
      getSplitsOptionDisabledReasonKey(laps, 5001, DistanceUnit.Kilometers),
    ).toBe("calculator:result.splitsDisabled.lapsLong");
  });

  it("is disabled for road events (primary splits not in meters), even within the 401–5000m range", () => {
    // 5K entered in km — primary splits unit is Kilometers, not Meters.
    expect(
      getSplitsOptionDisabledReasonKey(laps, 5000, DistanceUnit.Kilometers),
    ).toBe("calculator:result.splitsDisabled.lapsRoad");
  });

  it("is enabled for track-style middle distance (401–5000m, meters)", () => {
    expect(
      getSplitsOptionDisabledReasonKey(laps, 800, DistanceUnit.Meters),
    ).toBeNull();
    expect(
      getSplitsOptionDisabledReasonKey(laps, 1500, DistanceUnit.Meters),
    ).toBeNull();
    expect(
      getSplitsOptionDisabledReasonKey(laps, 5000, DistanceUnit.Meters),
    ).toBeNull();
  });
});

describe("getSplitsOptionDisabledReasonKey — hundredMeters", () => {
  const opt = SplitsOverrideOptions.hundredMeters;

  it("is enabled for distances up to 800m (the sprint + 800m range)", () => {
    expect(
      getSplitsOptionDisabledReasonKey(opt, 100, DistanceUnit.Meters),
    ).toBeNull();
    expect(
      getSplitsOptionDisabledReasonKey(opt, 800, DistanceUnit.Meters),
    ).toBeNull();
  });

  it("is disabled above 800m — 100m splits over a marathon would balloon to 422 rows", () => {
    expect(
      getSplitsOptionDisabledReasonKey(opt, 801, DistanceUnit.Meters),
    ).toBe("calculator:result.splitsDisabled.hundredMeters");
    expect(
      getSplitsOptionDisabledReasonKey(opt, 42195, DistanceUnit.Miles),
    ).toBe("calculator:result.splitsDisabled.hundredMeters");
  });
});

describe("getSplitsOptionDisabledReasonKey — K", () => {
  const opt = SplitsOverrideOptions.K;

  it("is enabled at and above 1K", () => {
    expect(
      getSplitsOptionDisabledReasonKey(opt, 1000, DistanceUnit.Meters),
    ).toBeNull();
    expect(
      getSplitsOptionDisabledReasonKey(opt, 5000, DistanceUnit.Kilometers),
    ).toBeNull();
  });

  it("is disabled below 1K — under a km of splits has nothing to show", () => {
    expect(
      getSplitsOptionDisabledReasonKey(opt, 800, DistanceUnit.Meters),
    ).toBe("calculator:result.splitsDisabled.K");
    expect(
      getSplitsOptionDisabledReasonKey(opt, 999, DistanceUnit.Meters),
    ).toBe("calculator:result.splitsDisabled.K");
  });
});

describe("getSplitsOptionDisabledReasonKey — miles", () => {
  const opt = SplitsOverrideOptions.miles;
  const ONE_MILE = 1609.344;

  it("is enabled at and above 1 mile (1609.344m)", () => {
    expect(
      getSplitsOptionDisabledReasonKey(opt, ONE_MILE, DistanceUnit.Miles),
    ).toBeNull();
    expect(
      getSplitsOptionDisabledReasonKey(opt, 5000, DistanceUnit.Kilometers),
    ).toBeNull();
  });

  it("is disabled below 1 mile — a half-mile of miles is just '0.5'", () => {
    expect(
      getSplitsOptionDisabledReasonKey(opt, 1500, DistanceUnit.Meters),
    ).toBe("calculator:result.splitsDisabled.miles");
    expect(
      getSplitsOptionDisabledReasonKey(opt, ONE_MILE - 1, DistanceUnit.Meters),
    ).toBe("calculator:result.splitsDisabled.miles");
  });
});

describe("getSplitsOptionDisabledReasonKey — null distance", () => {
  it("returns null for every option when distance hasn't been computed yet", () => {
    // Loading state — don't claim anything is disabled until we know the
    // distance. Callers default to the smart-default option anyway.
    expect(
      getSplitsOptionDisabledReasonKey(
        SplitsOverrideOptions.laps,
        null,
        undefined,
      ),
    ).toBeNull();
    expect(
      getSplitsOptionDisabledReasonKey(
        SplitsOverrideOptions.K,
        null,
        DistanceUnit.Kilometers,
      ),
    ).toBeNull();
  });
});
