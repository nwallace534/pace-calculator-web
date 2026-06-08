import { DistanceUnit } from "pace-calculator";
import { CalculatorStore } from "@/state/useCalculatorStore";
import { DistanceMode } from "@/types/distance";
import { sanitizeDistanceField, sanitizeTime } from "@/utils/input";

export type SharedTarget = {
  event: string;
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  timeHundredths: string;
  distanceWhole?: string;
  distanceFractional?: string;
  distanceUnit?: DistanceUnit;
};

const VALID_DISTANCE_UNITS = new Set<string>(Object.values(DistanceUnit));

const isCustomEvent = (event: string): boolean =>
  event === DistanceMode.Custom || event === DistanceMode.CustomTrack;

const hasTimeParam = (params: URLSearchParams): boolean =>
  ["h", "m", "s", "cs"].some((key) => params.has(key));

const getParam = (params: URLSearchParams, key: string): string =>
  params.get(key) ?? "0";

const getDistanceUnitParam = (
  params: URLSearchParams,
): DistanceUnit | undefined => {
  const unit = params.get("unit");
  if (!unit || !VALID_DISTANCE_UNITS.has(unit)) return undefined;
  return unit as DistanceUnit;
};

const setNonZeroTimeParam = (
  params: URLSearchParams,
  key: string,
  value: string,
): void => {
  if ((parseInt(value || "0") || 0) > 0) {
    params.set(key, value);
  }
};

export const parseSharedTarget = (search: string): SharedTarget | null => {
  const params = new URLSearchParams(search);
  const event = params.get("event");
  if (!event || !hasTimeParam(params)) return null;

  const target: SharedTarget = {
    event,
    ...sanitizeTime({
      timeHours: getParam(params, "h"),
      timeMinutes: getParam(params, "m"),
      timeSeconds: getParam(params, "s"),
      timeHundredths: getParam(params, "cs"),
    }),
  };

  if (!isCustomEvent(event)) return target;

  const distanceUnit = getDistanceUnitParam(params);
  if (!distanceUnit) return null;

  return {
    ...target,
    distanceWhole: sanitizeDistanceField(
      "distanceWhole",
      getParam(params, "dw"),
    ),
    distanceFractional: sanitizeDistanceField(
      "distanceFractional",
      getParam(params, "df"),
    ),
    distanceUnit,
  };
};

export const buildShareUrl = (
  state: CalculatorStore,
  location: Location,
): string => {
  const params = new URLSearchParams();
  params.set("event", state.event);
  setNonZeroTimeParam(params, "h", state.timeHours);
  setNonZeroTimeParam(params, "m", state.timeMinutes);
  setNonZeroTimeParam(params, "s", state.timeSeconds);
  setNonZeroTimeParam(params, "cs", state.timeHundredths);

  if (isCustomEvent(state.event)) {
    params.set("dw", state.distanceWhole || "0");
    params.set("df", state.distanceFractional || "0");
    params.set("unit", state.distanceUnit);
  }

  return `${location.origin}${location.pathname}?${params.toString()}`;
};

export const applySharedTarget = (
  target: SharedTarget,
  store: CalculatorStore,
): void => {
  store.setEvent(target.event);

  if (
    target.distanceWhole !== undefined &&
    target.distanceFractional !== undefined &&
    target.distanceUnit !== undefined
  ) {
    store.setDistanceUnit(target.distanceUnit);
    store.setDistanceWhole(target.distanceWhole);
    store.setDistanceFractional(target.distanceFractional);
  }

  store.setFullTime(
    target.timeHours,
    target.timeMinutes,
    target.timeSeconds,
    target.timeHundredths,
  );
};
