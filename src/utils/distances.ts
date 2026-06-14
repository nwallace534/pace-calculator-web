import { DistanceUnit } from "pace-calculator";

// Lowercase "m" avoids the SI mega-prefix / miles ambiguity; "mile" carries a leading space because it's a word.
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

// ≤ 1dp with trailing ".0" stripped (21.04 → "21", 21.08 → "21.1").
export const formatDistanceValue = (value: number): string =>
  String(Number(value.toFixed(1)));

// Always 2dp (0.4971 → "0.50", 42.2 → "42.20").
export const formatDistanceValueTwoDp = (value: number): string =>
  value.toFixed(2);

// Absorbs float drift from unit conversion without collapsing distinct hand-entered distances.
export const DISTANCE_MATCH_TOLERANCE_METERS = 0.5;
