import {
  DistanceUnit,
  getDistanceInAllUnits,
  MultiPace,
  Time,
} from "pace-calculator";
import { isCustomEvent } from "@/types/distance";
import {
  DISTANCE_MATCH_TOLERANCE_METERS,
  DistanceUnitStandardShortLabel,
  formatDistanceValueTwoDp,
  formatDistanceWithShortUnit,
  getDistanceUnitLabel,
} from "@/utils/distances";
import { Events, type Event } from "@/utils/events-data";
import { eventDistancesInMeters } from "@/utils/events";
import { getDecimalValue, getNumericValue } from "@/utils/input";
import { predictRaceTime } from "@/utils/predictions";
import { msToTime, timeToMs } from "@/utils/time";

export type SummaryPredictionRow = {
  id: string;
  timeText: string;
};

export type IntervalRow = {
  id: string;
  timeText: string;
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

// No rounding — these are exact arrival points, so a 9.988s rounded to "10s" would misstate the goal pace.
export const formatFriendlyTimeExact = (
  time: Time,
  showHundredths = false,
): string => {
  const hundredths = Math.floor(time.milliseconds / 10);
  return friendlyFromParts(
    time.hours,
    time.minutes,
    time.seconds,
    hundredths,
    showHundredths,
  );
};

// Seconds always show because "18m 00s" reads as exactly 18 minutes where "18m" looks rounded.
const friendlyFromParts = (
  h: number,
  m: number,
  s: number,
  hundredths: number,
  showHundredths: boolean,
): string => {
  const secondsString = (padded: boolean): string => {
    if (showHundredths) {
      const sec = padded ? String(s).padStart(2, "0") : String(s);
      return `${sec}.${String(hundredths).padStart(2, "0")}s`;
    }
    if (padded) return s === 0 ? "00s" : `${s}s`;
    return `${s}s`;
  };

  if (h > 0) {
    const mPart = m === 0 ? "00m" : `${m}m`;
    return `${h}h ${mPart} ${secondsString(true)}`;
  }
  if (m > 0) {
    return `${m}m ${secondsString(true)}`;
  }
  return secondsString(false);
};

type BuildSummaryPredictionRowsParams = {
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  timeHundredths: string;
  showHundredths: boolean;
};

const getInputMeters = (params: {
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
}): number => {
  const distanceValue =
    getNumericValue(params.distanceWhole) +
    getDecimalValue(params.distanceFractional);
  return getDistanceInAllUnits({
    distanceValue,
    distanceUnit: params.distanceUnit,
  }).inMeters.distanceValue;
};

const getSummaryReferenceEvent = (inputMeters: number): Event | null => {
  return (
    Events.map((event) => ({
      event,
      meters: eventDistancesInMeters[event.id] ?? 0,
    }))
      .filter(
        (event) =>
          event.meters <= inputMeters + DISTANCE_MATCH_TOLERANCE_METERS,
      )
      .sort((a, b) => b.meters - a.meters)[0]?.event ?? null
  );
};

const getReferenceMeters = (id: string): number =>
  eventDistancesInMeters[id] ?? 0;

export const buildSummaryPredictionRows = ({
  distanceWhole,
  distanceFractional,
  distanceUnit,
  timeHours,
  timeMinutes,
  timeSeconds,
  timeHundredths,
  showHundredths,
}: BuildSummaryPredictionRowsParams): SummaryPredictionRow[] => {
  const inputTime: Time = {
    hours: getNumericValue(timeHours),
    minutes: getNumericValue(timeMinutes),
    seconds: getNumericValue(timeSeconds),
    milliseconds: getNumericValue(timeHundredths) * 10,
  };

  const inputMeters = getInputMeters({
    distanceWhole,
    distanceFractional,
    distanceUnit,
  });

  const referenceEvent = getSummaryReferenceEvent(inputMeters);
  if (!referenceEvent) return [];

  return referenceEvent.summaryReferences.predictions
    .map((e) => ({
      id: e,
      meters: getReferenceMeters(e),
    }))
    .filter((e) => e.meters < inputMeters - DISTANCE_MATCH_TOLERANCE_METERS)
    .map((e): SummaryPredictionRow | null => {
      const prediction = predictRaceTime({
        inputTime,
        inputMeters,
        targetMeters: e.meters,
      });
      if (!prediction) return null;
      return {
        id: e.id,
        timeText: formatFriendlyTimeExact(prediction, showHundredths),
      };
    })
    .filter((row): row is SummaryPredictionRow => row !== null);
};

type BuildIntervalRowsParams = {
  paceResults: MultiPace | null;
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
  showHundredths: boolean;
};

export const buildIntervalRows = ({
  paceResults,
  distanceWhole,
  distanceFractional,
  distanceUnit,
  showHundredths,
}: BuildIntervalRowsParams): IntervalRow[] => {
  if (!paceResults) return [];

  const inputMeters = getInputMeters({
    distanceWhole,
    distanceFractional,
    distanceUnit,
  });
  if (inputMeters <= 0) return [];

  const msPerMeter = timeToMs(paceResults.perKilometer) / 1000;

  const referenceEvent = getSummaryReferenceEvent(inputMeters);
  if (!referenceEvent) return [];

  return referenceEvent.summaryReferences.intervals
    .map((e) => ({
      id: e,
      meters: getReferenceMeters(e),
    }))
    .filter((i) => i.meters < inputMeters - DISTANCE_MATCH_TOLERANCE_METERS)
    .map((i) => ({
      id: i.id,
      timeText: formatFriendlyTimeExact(
        msToTime(i.meters * msPerMeter),
        showHundredths,
      ),
    }));
};
