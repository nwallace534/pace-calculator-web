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

// Predicted-race-times tiers, applied by `getPredictionFloorMeters`:
//
//   - Long tier: goal ≥ 10K → predict down to the 5K floor (5K, 10K, Half
//     for marathon goals; 5K, 10K for half marathon; 5K for 10K).
//   - Short tier: goal ≤ 3K → predict down to the 800m floor (e.g. 3K shows
//     800m + 1500m; 1500m shows 800m; 800m shows nothing).
//   - Middle range (3K < goal < 10K, including a 5K goal) → no predictions.
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

// Compact format with no rounding — uses the Time fields as-is
// and drops sub-second precision via truncation. Used for "Times at goal
// pace" where the row IS the exact arrival time, so bumping a 9.988 second
// total up to "10s" would mis-state the goal pace. Pass `showHundredths`
// for meter / sprint events where 1/100s precision matters; the seconds
// then render as the track-timing decimal "12.45s" / "1m 53.28s".
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

// Compact h/m/s renderer. Seconds always show when a larger unit is
// present — "18m 00s" reads as "exactly 18 minutes" where "18m" alone
// looks rounded. Same logic for minutes when hours are present. When
// `showHundredths` is on (sprint / meter events), seconds become the
// track-timing decimal "Xs.YY".
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

  // Predictions only apply in two tiers (see `getPredictionFloorMeters`):
  // long goals (≥ 10K) drop down to 5K; short goals (≤ 3K) drop down to
  // 800m; the middle range — including a 5K goal exactly — gets nothing.
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

// Reference checkpoints at goal pace, ordered short → long. Anything ≥ the
// goal distance is dropped — no point telling a 400m runner what 1km at their
// pace is — so a marathon goal lights up the whole list while a 5K shows just
// the rows that fit.
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

  // Goals at or under 400m don't get a Times-at-goal-pace section — the
  // splits below already show 100m / 200m landmarks, so there's nothing
  // extra to surface here.
  if (inputMeters <= 400) return [];

  const msPerMeter = timeToMs(paceResults.perKilometer) / 1000;

  // For 5K-and-above goals, hide the sprint references (100m / 200m). They
  // don't carry useful pacing meaning at endurance distances, where 400m is
  // the natural shortest split. Shorter goals (sprints, middle distance)
  // keep the full ladder so a 1500m goal still sees 100m / 200m laps.
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
