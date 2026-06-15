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

type EventLabelParams = {
  event: string;
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
  eventLabel: string;
};

// Custom / CustomTrack have no catalog label so use the entered distance.
export const getEventLabelText = ({
  event,
  distanceWhole,
  distanceFractional,
  distanceUnit,
  eventLabel,
}: EventLabelParams): string => {
  const customLabel = getCustomDistanceLabel({
    event,
    distanceWhole,
    distanceFractional,
    distanceUnit,
  });
  return customLabel ?? eventLabel;
};

type CustomDistanceLabelParams = {
  event: string;
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
};

// Returns null for built-in events so callers can fall back to the i18n label.
export const getCustomDistanceLabel = ({
  event,
  distanceWhole,
  distanceFractional,
  distanceUnit,
}: CustomDistanceLabelParams): string | null => {
  if (event !== DistanceMode.Custom && event !== DistanceMode.CustomTrack) {
    return null;
  }
  const value =
    getNumericValue(distanceWhole) + getDecimalValue(distanceFractional);
  return `${formatDistanceValue(value)}${DistanceUnitShortLabel[distanceUnit]}`;
};

type DistanceLineParams = {
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
};

// Miles events render both sides because the headline carries no unit suffix.
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

// Track events label by cumulative meter landmark (the number carries pacing meaning); road events use the split index.
export const formatSplitLabel = (
  unit: DistanceUnit | undefined,
  distance: number,
  splitNumber: number,
): string => {
  if (unit === DistanceUnit.Meters) return `${distance}`;
  if (Number.isInteger(distance)) return `${splitNumber}`;
  return distance.toFixed(2);
};
