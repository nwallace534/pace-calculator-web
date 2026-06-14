import {
  DistanceUnit,
  getDistanceInAllUnits,
  MultiPace,
  Time,
} from "pace-calculator";
import { Events, EventTags } from "@/utils/events-data";
import { eventDistancesInMeters } from "@/utils/events";
import { getDecimalValue, getNumericValue } from "@/utils/input";
import { predictRaceTime } from "@/utils/predictions";
import { DISTANCE_MATCH_TOLERANCE_METERS } from "@/utils/distances";
import { msToTime, timeToMs } from "@/utils/time";

// Middle range (3K < goal < 10K) gets no predictions — Riegel across that gap is too lossy to be useful.
const LONG_TIER_INPUT_METERS = 10_000;
const LONG_TIER_FLOOR_METERS = 5_000;
const SHORT_TIER_INPUT_METERS = 3_000;
const SHORT_TIER_FLOOR_METERS = 800;

const getPredictionFloorMeters = (inputMeters: number): number | null => {
  if (inputMeters >= LONG_TIER_INPUT_METERS) return LONG_TIER_FLOOR_METERS;
  if (inputMeters <= SHORT_TIER_INPUT_METERS) return SHORT_TIER_FLOOR_METERS;
  return null;
};
export type SummaryPredictionRow = {
  id: string;
  time: Time;
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

export type IntervalRow = {
  label: string;
  time: Time;
};

type BuildSummaryPredictionRowsParams = {
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  timeHundredths: string;
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

export const buildSummaryPredictionRows = ({
  distanceWhole,
  distanceFractional,
  distanceUnit,
  timeHours,
  timeMinutes,
  timeSeconds,
  timeHundredths,
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

  const floor = getPredictionFloorMeters(inputMeters);
  if (floor === null) return [];

  return Events.filter((e) => e.eventTags.includes(EventTags.TimesForPace))
    .map((e) => ({
      id: e.id,
      meters: eventDistancesInMeters[e.id] ?? 0,
    }))
    .filter(
      (e) =>
        e.meters >= floor &&
        e.meters < inputMeters - DISTANCE_MATCH_TOLERANCE_METERS,
    )
    .sort((a, b) => a.meters - b.meters)
    .map((e): SummaryPredictionRow | null => {
      const prediction = predictRaceTime({
        inputTime,
        inputMeters,
        targetMeters: e.meters,
      });
      if (!prediction) return null;
      return {
        id: e.id,
        time: prediction,
      };
    })
    .filter((row): row is SummaryPredictionRow => row !== null);
};

type BuildIntervalRowsParams = {
  paceResults: MultiPace | null;
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
};

// Filtered at runtime to entries shorter than the goal.
const INTERVAL_REFERENCE_METERS: { label: string; meters: number }[] = [
  { label: "100m", meters: 100 },
  { label: "200m", meters: 200 },
  { label: "400m", meters: 400 },
  { label: "800m", meters: 800 },
  { label: "1km", meters: 1000 },
  { label: "1mi", meters: 1609.344 },
  { label: "3000m", meters: 3000 },
  { label: "5K", meters: 5000 },
  { label: "10K", meters: 10000 },
  { label: "1/2 Mar", meters: 21097.5 },
];

export const buildIntervalRows = ({
  paceResults,
  distanceWhole,
  distanceFractional,
  distanceUnit,
}: BuildIntervalRowsParams): IntervalRow[] => {
  if (!paceResults) return [];

  const inputMeters = getInputMeters({
    distanceWhole,
    distanceFractional,
    distanceUnit,
  });
  if (inputMeters <= 0) return [];

  // Sub-400m goals would just duplicate the splits below.
  if (inputMeters <= 400) return [];

  const msPerMeter = timeToMs(paceResults.perKilometer) / 1000;

  // Sprint references (100m / 200m) carry no useful pacing at endurance distances.
  const ENDURANCE_GOAL_THRESHOLD_METERS = 5000;
  const ENDURANCE_INTERVAL_FLOOR_METERS = 400;
  const isEnduranceGoal = inputMeters >= ENDURANCE_GOAL_THRESHOLD_METERS;

  return INTERVAL_REFERENCE_METERS.filter(
    (i) =>
      i.meters < inputMeters - DISTANCE_MATCH_TOLERANCE_METERS &&
      (!isEnduranceGoal || i.meters >= ENDURANCE_INTERVAL_FLOOR_METERS),
  ).map((i) => ({
    label: i.label,
    time: msToTime(i.meters * msPerMeter),
  }));
};
