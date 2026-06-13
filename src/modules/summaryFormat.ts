import { DistanceUnit, getDistanceInAllUnits } from "pace-calculator";
import { DistanceMode } from "@/types/distance";
import {
  DistanceUnitShortLabel,
  formatDistanceValue,
  formatDistanceValueTwoDp,
} from "@/utils/distances";
import { getDecimalValue, getNumericValue } from "@/utils/input";

export const getSplitsUnitKey = (
  unit: DistanceUnit | undefined,
): "miles" | "meters" | "kilometers" | null => {
  if (unit === DistanceUnit.Miles) return "miles";
  if (unit === DistanceUnit.Meters) return "meters";
  if (unit === DistanceUnit.Kilometers) return "kilometers";
  return null;
};

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
  eventLabel: string;
};

// Custom / CustomTrack render the entered distance as the label; built-in
// events use their catalog label.
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

// Miles events get both sides ("26.20 miles = 42.16 km") because the headline
// has no unit suffix; km/meter events get only the imperial equivalent.
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

// Track events label by the cumulative meter landmark (300 / 700 / …) since
// the number carries pacing meaning; road events index by integer split
// number (the unit is in the heading) with a 2dp tail for partial rows.
export const formatSplitLabel = (
  unit: DistanceUnit | undefined,
  distance: number,
  splitNumber: number,
): string => {
  if (unit === DistanceUnit.Meters) return `${distance}`;
  if (Number.isInteger(distance)) return `${splitNumber}`;
  return distance.toFixed(2);
};
