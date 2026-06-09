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

// The shortest race we show as an equivalent. Below this, runners care about
// laps/sprints rather than steady-pace endurance equivalents.
const MIN_EQUIVALENT_DISTANCE_METERS = 5000;
// Half-marathon distance. At/above this, friendly time is rounded to the
// nearest minute; below it, to the nearest 15 seconds.
const MINUTE_ROUNDING_THRESHOLD_METERS = 21097;

// Lowercased forms so "A {label} in …" reads naturally mid-sentence. The set
// is closed: only TimesForPace catalog events ≥ 5K can appear here, which is
// these four ids.
const FRIENDLY_LABELS: Record<string, string> = {
  fiveK: "5K",
  tenK: "10K",
  halfMarathon: "half marathon",
  marathon: "marathon",
};

export type SummaryPredictionRow = {
  id: string;
  label: string;
  friendlyTime: string;
};

const pluralise = (n: number, singular: string) =>
  `${n} ${n === 1 ? singular : `${singular}s`}`;

// "1 hour 26 minutes" / "18 minutes 45 seconds" / "39 minutes" / "3 hours".
// Drops zero parts so single-unit outputs (e.g. exactly 39:00) read clean.
export const formatFriendlyTime = (
  ms: number,
  targetMeters: number,
): string => {
  const stepMs =
    targetMeters >= MINUTE_ROUNDING_THRESHOLD_METERS ? 60_000 : 15_000;
  const rounded = Math.round(ms / stepMs) * stepMs;
  const totalSec = Math.floor(rounded / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec / 60) % 60);
  const s = totalSec % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(pluralise(h, "hour"));
  if (m > 0) parts.push(pluralise(m, "minute"));
  if (s > 0) parts.push(pluralise(s, "second"));
  if (parts.length === 0) parts.push("0 minutes");
  return parts.join(" ");
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

  // Below 5K is the floor: no race we'd predict from here. Also covers 5K
  // itself, which has nothing shorter in this set.
  if (inputMeters <= MIN_EQUIVALENT_DISTANCE_METERS) return [];

  return Events.filter((e) => e.eventTags.includes(EventTags.TimesForPace))
    .map((e) => ({
      id: e.id,
      meters: eventDistancesInMeters[e.id] ?? 0,
    }))
    .filter(
      (e) =>
        e.meters >= MIN_EQUIVALENT_DISTANCE_METERS &&
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
      const label = FRIENDLY_LABELS[e.id] ?? e.id;
      return {
        id: e.id,
        label,
        friendlyTime: formatFriendlyTime(timeToMs(prediction), e.meters),
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
  { label: "400m", meters: 400 },
  { label: "800m", meters: 800 },
  { label: "1km", meters: 1000 },
  { label: "1mi", meters: 1609.344 },
  { label: "3000m", meters: 3000 },
  { label: "5K", meters: 5000 },
  { label: "10K", meters: 10000 },
  { label: "Half Marathon", meters: 21097.5 },
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

  const msPerMeter = timeToMs(paceResults.perKilometer) / 1000;

  return INTERVAL_REFERENCE_METERS.filter(
    (i) => i.meters < inputMeters - DISTANCE_MATCH_TOLERANCE_METERS,
  ).map((i) => ({
    label: i.label,
    time: msToTime(i.meters * msPerMeter),
  }));
};
