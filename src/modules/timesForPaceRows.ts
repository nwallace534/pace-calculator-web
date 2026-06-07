import { DistanceUnit, getDistanceInAllUnits, Time } from "pace-calculator";
import { DistanceMode } from "@/types/distance";
import { SavedDistance } from "@/state/savedDistancesSlice";
import {
  DISTANCE_MATCH_TOLERANCE_METERS,
  DistanceUnitShortLabel,
  formatDistanceValue,
} from "@/utils/distances";
import {
  eventDistancesInMeters,
  getDistanceInMetersForId,
} from "@/utils/events";
import { getDecimalValue, getNumericValue } from "@/utils/input";
import { predictRaceTime } from "@/utils/predictions";

export type TimesForPaceRow = {
  id: string;
  label: string;
  time: Time;
  prediction: Time | null;
  highlight: boolean;
  isSaved: boolean;
};

type BuildTimesForPaceRowsParams = {
  results: Record<string, Time> | null;
  event: string;
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  timeHundredths: string;
  savedDistances: SavedDistance[];
  getEventLabel: (id: string) => string;
};

const getSavedDistanceLabel = (
  id: string,
  savedDistances: SavedDistance[],
): string | null => {
  const saved = savedDistances.find((s) => `saved:${s.id}` === id);
  if (!saved) return null;
  return `${formatDistanceValue(saved.distanceValue)}${DistanceUnitShortLabel[saved.distanceUnit]}`;
};

const getMatchedSavedId = (
  inputMeters: number,
  savedDistances: SavedDistance[],
): string | null => {
  const saved = savedDistances.find((candidate) => {
    const savedMeters = getDistanceInAllUnits({
      distanceValue: candidate.distanceValue,
      distanceUnit: candidate.distanceUnit,
    }).inMeters.distanceValue;
    return (
      Math.abs(savedMeters - inputMeters) < DISTANCE_MATCH_TOLERANCE_METERS
    );
  });

  return saved?.id ?? null;
};

export const buildTimesForPaceRows = ({
  results,
  event,
  distanceWhole,
  distanceFractional,
  distanceUnit,
  timeHours,
  timeMinutes,
  timeSeconds,
  timeHundredths,
  savedDistances,
  getEventLabel,
}: BuildTimesForPaceRowsParams): TimesForPaceRow[] => {
  const inputTime = {
    hours: getNumericValue(timeHours),
    minutes: getNumericValue(timeMinutes),
    seconds: getNumericValue(timeSeconds),
    // hundredths field is centiseconds -> x10 for library ms.
    milliseconds: getNumericValue(timeHundredths) * 10,
  };

  const inputDistanceValue =
    getNumericValue(distanceWhole) + getDecimalValue(distanceFractional);
  const inputMeters = getDistanceInAllUnits({
    distanceValue: inputDistanceValue,
    distanceUnit,
  }).inMeters.distanceValue;

  let customRow: TimesForPaceRow | null = null;
  let customMeters = 0;
  let highlightId: string = event;

  const isCustomMode =
    event === DistanceMode.Custom || event === DistanceMode.CustomTrack;

  if (isCustomMode) {
    const matchedEventId = Object.entries(eventDistancesInMeters).find(
      ([, meters]) =>
        Math.abs(meters - inputMeters) < DISTANCE_MATCH_TOLERANCE_METERS,
    )?.[0];

    const matchedSavedId = matchedEventId
      ? null
      : getMatchedSavedId(inputMeters, savedDistances);

    if (matchedEventId) {
      highlightId = matchedEventId;
    } else if (matchedSavedId) {
      highlightId = `saved:${matchedSavedId}`;
    } else {
      customMeters = inputMeters;
      customRow = {
        id: event,
        label: `${formatDistanceValue(inputDistanceValue)}${DistanceUnitShortLabel[distanceUnit]}`,
        time: inputTime,
        prediction: predictRaceTime({
          inputTime,
          inputMeters,
          targetMeters: inputMeters,
        }),
        highlight: true,
        isSaved: false,
      };
    }
  }

  const rows: TimesForPaceRow[] = [];
  if (!results) return rows;

  let inserted = false;
  for (const [id, time] of Object.entries(results)) {
    const rowMeters = getDistanceInMetersForId(id, savedDistances);
    if (customRow && !inserted && rowMeters > customMeters) {
      rows.push(customRow);
      inserted = true;
    }

    const isSaved = id.startsWith("saved:");
    let label: string | null = getEventLabel(id);
    if (isSaved) {
      label = getSavedDistanceLabel(id, savedDistances);
    }

    if (!label) continue;

    rows.push({
      id,
      label,
      time,
      prediction: predictRaceTime({
        inputTime,
        inputMeters,
        targetMeters: rowMeters,
      }),
      highlight: id === highlightId,
      isSaved,
    });
  }

  if (customRow && !inserted) {
    rows.push(customRow);
  }

  return rows;
};
