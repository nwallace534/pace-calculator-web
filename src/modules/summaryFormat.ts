import { DistanceUnit, getDistanceInAllUnits } from "pace-calculator";
import { isCustomEvent } from "@/types/distance";
import {
  DistanceUnitStandardShortLabel,
  formatDistanceValueTwoDp,
  formatDistanceWithShortUnit,
  getDistanceUnitLabel,
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
  if (!isCustomEvent(event)) return null;
  const value =
    getNumericValue(distanceWhole) + getDecimalValue(distanceFractional);
  return formatDistanceWithShortUnit(value, distanceUnit);
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
  )} ${getDistanceUnitLabel(DistanceUnit.Miles)}`;
  if (distanceUnit === DistanceUnit.Miles) {
    const inKm = `${formatDistanceValueTwoDp(
      distanceAllUnits.inKilometers.distanceValue,
    )} ${DistanceUnitStandardShortLabel[DistanceUnit.Kilometers]}`;
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
