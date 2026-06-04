import { DistanceMode } from "@/types/distance";
import { Distance, DistanceUnit, getDistanceInAllUnits } from "pace-calculator";
import { getDecimalValue, getNumericValue, getValidatedInput } from "./input";
import { CalculatorTime, timeStringsToMs } from "./time";
import { Event, Events, EventTags, TimeExample } from "./events-data";

export { Events, EventTags };
export type { Event };

const getEventsForPace = (events: Event[]) => {
  return events.reduce<Record<string, Distance>>((acc, event) => {
    acc[event.id] = {
      distanceValue:
        getNumericValue(event.distanceValue) +
        getDecimalValue(event.distanceDecimal),
      distanceUnit: event.distanceUnit,
    };
    return acc;
  }, {});
};

const metricEvents = Events.filter(
  (event) =>
    event.distanceUnit === DistanceUnit.Kilometers ||
    event.distanceUnit === DistanceUnit.Meters,
);

export const metricEventsForPace = getEventsForPace(metricEvents);

export const imperialEventsForPace = getEventsForPace(
  Events.filter((event) => event.distanceUnit === DistanceUnit.Miles),
);

export const eventDistancesInMeters: Record<string, number> = Events.reduce<
  Record<string, number>
>((acc, event) => {
  const distance: Distance = {
    distanceValue:
      getNumericValue(event.distanceValue) +
      getDecimalValue(event.distanceDecimal),
    distanceUnit: event.distanceUnit,
  };
  acc[event.id] = getDistanceInAllUnits(distance).inMeters.distanceValue;
  return acc;
}, {});

export const DEFAULT_EVENT_ID = "fiveK";

const GLOBAL_MAX_TIME_SECONDS = 99 * 3600 + 59 * 60 + 59;
const SUB_HOUR_MAX_TIME_SECONDS = 59 * 60 + 59;
const SUB_MINUTE_MAX_TIME_SECONDS = 59;

const getMaxTimeSeconds = (eventId: string): number => {
  if (eventId === DistanceMode.Custom) return GLOBAL_MAX_TIME_SECONDS;
  const event = Events.find((e) => e.id === eventId);
  if (event?.showHours === true) return GLOBAL_MAX_TIME_SECONDS;
  if (event?.showMinutes === false) return SUB_MINUTE_MAX_TIME_SECONDS;
  return SUB_HOUR_MAX_TIME_SECONDS;
};

// The hundredths tail (max 990ms) is added only for events that show the
// field — otherwise the cap sits above any value the user can enter and
// the spinner never registers atMax.
export const getMaxTimeMs = (eventId: string): number => {
  const event = Events.find((e) => e.id === eventId);
  const showsHundredths =
    event?.showHundredths === true || eventId === DistanceMode.CustomTrack;
  return getMaxTimeSeconds(eventId) * 1000 + (showsHundredths ? 990 : 0);
};

export const getStepMs = (eventId: string): number => {
  if (eventId === DistanceMode.Custom) return 1000;
  // Track Custom mirrors the sprint events: step in hundredths.
  if (eventId === DistanceMode.CustomTrack) return 10;
  const event = Events.find((e) => e.id === eventId);
  return event?.stepMs ?? 1000;
};

// opening = total % interval (a partial first lap when total isn't a clean
// multiple), then full intervals up to total. The pace-calculator library
// only handles uniform intervals, so these landmarks are scaled by proportion
// in calculator.ts.
const generateLandmarks = (total: number, interval: number): number[] => {
  const landmarks: number[] = [];
  const opening = total % interval;
  if (opening > 0) landmarks.push(opening);
  for (let m = opening + interval; m <= total; m += interval) {
    landmarks.push(m);
  }
  if (landmarks.length > 0 && landmarks[landmarks.length - 1] !== total) {
    landmarks.push(total);
  }
  return landmarks;
};

// Track-style cumulative landmarks for events that pace by laps rather than
// road km/miles. Returns null for road events (5K+) — calculator.ts falls
// through to its km/mile splits path for those.
export const getEventLandmarks = (
  eventId: string,
  totalMeters: number,
): number[] | null => {
  if (totalMeters <= 0) return null;

  const event = Events.find((e) => e.id === eventId);
  const tags = event?.eventTags ?? [];

  // Sprints (100m / 200m / 400m) pace in 100m segments.
  if (tags.includes(EventTags.Sprints)) {
    return generateLandmarks(totalMeters, 100);
  }
  // Middle-distance (800m / 1500m / mile / 3000m) paces in 400m laps.
  if (tags.includes(EventTags.MiddleDistance)) {
    return generateLandmarks(totalMeters, 400);
  }
  // Custom Track is meters-only and always pace-by-laps: 400m above the
  // threshold, 100m intervals below to keep splits useful at short distances.
  if (eventId === DistanceMode.CustomTrack) {
    return generateLandmarks(totalMeters, totalMeters >= 400 ? 400 : 100);
  }

  return null;
};

export const getVisibleTimeFields = (eventId: string) => {
  const event = Events.find((e) => e.id === eventId);
  const isCustom = eventId === DistanceMode.Custom;
  const isCustomTrack = eventId === DistanceMode.CustomTrack;
  return {
    showHours: event?.showHours === true || isCustom,
    showMinutes: isCustom || isCustomTrack || event?.showMinutes !== false,
    showHundredths: event?.showHundredths === true || isCustomTrack,
  };
};

// Zero out fields the destination event hides. Without this, hundredths
// carried over from a sub-second event would silently drive pace/speed on
// an event whose UI doesn't show them.
export const sanitizeTimeForEvent = (
  time: CalculatorTime,
  eventId: string,
): CalculatorTime => {
  const { showHours, showMinutes, showHundredths } =
    getVisibleTimeFields(eventId);
  return {
    timeHours: getValidatedInput(showHours ? time.timeHours : "0", 99, 2),
    timeMinutes: getValidatedInput(showMinutes ? time.timeMinutes : "0", 59, 2),
    timeSeconds: getValidatedInput(time.timeSeconds, 59, 2),
    timeHundredths: getValidatedInput(
      showHundredths ? time.timeHundredths : "0",
      99,
      2,
    ),
  };
};

const timeExampleToMs = (t: TimeExample["time"]): number => timeStringsToMs(t);

// Records are sanitised to the event's display precision before conversion,
// otherwise loading the 5K WR (12:35.36) into a UI that hides hundredths
// leaves 12:35.00 on screen — faster than the raw floor — and trips the
// WR warning on the catalog record itself.
const getEventWrPaceSecPerKm = (eventId: string): number | null => {
  const event = Events.find((e) => e.id === eventId);
  const records =
    event?.eventGuide?.timeExamples.filter(
      (ex) => ex.id === "mWR" || ex.id === "fWR",
    ) ?? [];
  if (records.length === 0) return null;
  const meters = eventDistancesInMeters[eventId];
  if (!meters) return null;
  const fastestMs = records.reduce(
    (best, ex) =>
      Math.min(best, timeExampleToMs(sanitizeTimeForEvent(ex.time, eventId))),
    Infinity,
  );
  return fastestMs / meters;
};

const catalogWrPaces: { meters: number; secPerKm: number }[] = Events.map(
  (e) => {
    const meters = eventDistancesInMeters[e.id];
    const secPerKm = getEventWrPaceSecPerKm(e.id);
    return meters && secPerKm !== null ? { meters, secPerKm } : null;
  },
)
  .filter((x): x is { meters: number; secPerKm: number } => x !== null)
  .sort((a, b) => a.meters - b.meters);

// Returns the slower (max sec/km) of the two bracketing catalog records, so
// the user must beat both nearby WRs to trip the warning. Nearest-by-delta
// was too lenient at middle distances (e.g. 3000m inheriting 1500m pace).
// Returns null above the longest catalog event — under-warning beats a
// false positive for ultras.
const getBracketedRecordPaceSecPerKm = (
  distanceMeters: number,
): number | null => {
  if (distanceMeters <= 0) return null;
  let lower: { meters: number; secPerKm: number } | null = null;
  let upper: { meters: number; secPerKm: number } | null = null;
  for (const entry of catalogWrPaces) {
    if (entry.meters === distanceMeters) return entry.secPerKm;
    if (entry.meters < distanceMeters) {
      lower = entry;
    } else {
      upper = entry;
      break;
    }
  }
  if (!upper) return null;
  if (!lower) return upper.secPerKm;
  return Math.max(lower.secPerKm, upper.secPerKm);
};

// In sec/km so the check is distance-agnostic.
export const getFastestRecordPace = (
  eventId: string,
  customDistanceMeters: number,
): { secPerKm: number } | null => {
  const secPerKm =
    eventId === DistanceMode.Custom || eventId === DistanceMode.CustomTrack
      ? getBracketedRecordPaceSecPerKm(customDistanceMeters)
      : getEventWrPaceSecPerKm(eventId);
  return secPerKm !== null ? { secPerKm } : null;
};

export const getDistanceDetailsFromEvent = (eventId: string) => {
  let changes = null;

  if (eventId !== DistanceMode.Custom && eventId !== DistanceMode.CustomTrack) {
    const selectedEvent = Events.find((event) => event.id === eventId);

    if (selectedEvent) {
      const distance = selectedEvent.distanceValue;
      const distanceDecimal = selectedEvent.distanceDecimal;
      const distanceUnit = selectedEvent.distanceUnit;

      changes = {
        distance,
        distanceDecimal,
        distanceUnit,
      };
    }
  }

  return changes;
};
