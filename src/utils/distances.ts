import { DistanceUnit } from "pace-calculator";

// Short labels for splits and custom rows. Running-culture "K" matches the
// catalog event labels ("5K"/"10K"); "mile" carries a leading space because
// it's a word, not a unit symbol; lowercase "m" matches "100m"/"200m" and
// avoids the SI ambiguity where uppercase "M" reads as the mega prefix or
// (in race contexts) as miles.
export const DistanceUnitShortLabel: Record<DistanceUnit, string> = {
  [DistanceUnit.Kilometers]: "K",
  [DistanceUnit.Miles]: " mile",
  [DistanceUnit.Meters]: "m",
};

export const DistanceUnitOptions = [
  {
    label: "K",
    value: DistanceUnit.Kilometers,
    singularLabel: "K",
    speedLabel: "km/h",
  },
  {
    label: "miles",
    value: DistanceUnit.Miles,
    singularLabel: "mile",
    speedLabel: "mph",
  },
  {
    label: "meters",
    value: DistanceUnit.Meters,
    singularLabel: "m",
    speedLabel: "meters/sec",
  },
];

export const getDistanceUnitSingular = (distanceUnit: DistanceUnit) =>
  DistanceUnitOptions.find(
    (distanceUnitOption) => distanceUnitOption.value === distanceUnit,
  )?.singularLabel;

// Formats a distance to at most one decimal place, dropping a trailing ".0" so
// whole numbers display without a decimal (e.g. 21.04 -> "21", 21.08 -> "21.1").
export const formatDistanceValue = (value: number): string =>
  String(Number(value.toFixed(1)));

// Absorbs float drift from unit conversion — not a fuzzy match for user-entered
// "near" distances. Small enough that distinct hand-entered distances stay
// distinct.
export const DISTANCE_MATCH_TOLERANCE_METERS = 0.5;
