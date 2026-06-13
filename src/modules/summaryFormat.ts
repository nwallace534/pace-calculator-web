import { DistanceUnit, getDistanceInAllUnits } from "pace-calculator";
import { DistanceMode } from "@/types/distance";
import {
  DistanceUnitShortLabel,
  formatDistanceValue,
  formatDistanceValueTwoDp,
} from "@/utils/distances";
import { getDecimalValue, getNumericValue } from "@/utils/input";

// Translation key suffix for the splits-heading unit ("Splits in {km|miles|m}").
// `null` covers events without a unit (the heading omits the suffix).
export const getSplitsUnitKey = (
  unit: DistanceUnit | undefined,
): "miles" | "meters" | "kilometers" | null => {
  if (unit === DistanceUnit.Miles) return "miles";
  if (unit === DistanceUnit.Meters) return "meters";
  if (unit === DistanceUnit.Kilometers) return "kilometers";
  return null;
};

// Splits packing: 1 / 2 / 3 columns by row count. Sparse goals use a single
// column; marathon's ~27 rows fan out to 3.
export const getSplitsColumnCount = (rowCount: number): number => {
  if (rowCount > 16) return 3;
  if (rowCount > 8) return 2;
  return 1;
};

type EventLabelParams = {
  event: string;
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
  /** Catalog label for the event ("5K", "Marathon", "100m" …). Used as-is for
   *  non-custom events; ignored for Custom / CustomTrack where the distance
   *  itself becomes the label. */
  eventLabel: string;
};

// For Custom / CustomTrack events the catalog has no label of its own — render
// the entered distance + unit (e.g. "7.5km", "500m"). Built-in events use
// their catalog label directly.
export const getEventLabelText = ({
  event,
  distanceWhole,
  distanceFractional,
  distanceUnit,
  eventLabel,
}: EventLabelParams): string => {
  if (event === DistanceMode.Custom || event === DistanceMode.CustomTrack) {
    const value =
      getNumericValue(distanceWhole) + getDecimalValue(distanceFractional);
    return `${formatDistanceValue(value)}${DistanceUnitShortLabel[distanceUnit]}`;
  }
  return eventLabel;
};

type DistanceLineParams = {
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
};

// Details-line distance string. For miles events the headline doesn't carry
// the unit so both sides show ("26.20 miles = 42.16 km"). For km/meter
// events the headline already implies metric, so the line just adds the
// imperial equivalent.
export const buildDistanceLine = ({
  distanceWhole,
  distanceFractional,
  distanceUnit,
}: DistanceLineParams): string => {
  const distanceAllUnits = getDistanceInAllUnits({
    distanceValue:
      getNumericValue(distanceWhole) + getDecimalValue(distanceFractional),
    distanceUnit,
  });
  const inMiles = `${formatDistanceValueTwoDp(
    distanceAllUnits.inMiles.distanceValue,
  )} miles`;
  if (distanceUnit === DistanceUnit.Miles) {
    const inKm = `${formatDistanceValueTwoDp(
      distanceAllUnits.inKilometers.distanceValue,
    )} km`;
    return `${inMiles} = ${inKm}`;
  }
  return inMiles;
};

// Per-row split label. Track events use the cumulative meter landmark
// (300 / 700 / …) since those carry meaning. Road events index by integer
// split number (the unit is in the heading); any partial-distance tail
// renders the fractional distance to 2dp.
export const formatSplitLabel = (
  unit: DistanceUnit | undefined,
  distance: number,
  splitNumber: number,
): string => {
  if (unit === DistanceUnit.Meters) return `${distance}`;
  if (Number.isInteger(distance)) return `${splitNumber}`;
  return distance.toFixed(2);
};
