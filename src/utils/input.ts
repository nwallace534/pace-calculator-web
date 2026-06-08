export const getValidatedInput = (
  inputValue: string,
  maxNumber: number,
  padZeroLength: number,
) => {
  let value = inputValue;

  value = value.replace(/'/g, "");
  value = value.replace(/:/g, "");
  value = value.replace(/\./g, "");

  const numericValue = getNumericValue(value);

  value = numericValue.toString();

  if (maxNumber > 0) {
    if (numericValue > maxNumber) {
      value = maxNumber.toString();
    }
  }

  if (padZeroLength > value.length) {
    value = value.padStart(padZeroLength, "0");
  }

  return value;
};

export type TimeField =
  | "timeHours"
  | "timeMinutes"
  | "timeSeconds"
  | "timeHundredths";

const TIME_FIELD_LIMITS: Record<TimeField, { max: number; pad: number }> = {
  timeHours: { max: 99, pad: 2 },
  timeMinutes: { max: 59, pad: 2 },
  timeSeconds: { max: 59, pad: 2 },
  timeHundredths: { max: 99, pad: 2 },
};

export const sanitizeTimeField = (field: TimeField, value: string): string => {
  const { max, pad } = TIME_FIELD_LIMITS[field];
  return getValidatedInput(value, max, pad);
};

export type TimeStrings = Record<TimeField, string>;

export const sanitizeTime = (time: TimeStrings): TimeStrings => ({
  timeHours: sanitizeTimeField("timeHours", time.timeHours),
  timeMinutes: sanitizeTimeField("timeMinutes", time.timeMinutes),
  timeSeconds: sanitizeTimeField("timeSeconds", time.timeSeconds),
  timeHundredths: sanitizeTimeField("timeHundredths", time.timeHundredths),
});

export type DistanceField = "distanceWhole" | "distanceFractional";

const DISTANCE_FIELD_LIMITS: Record<
  DistanceField,
  { max: number; pad: number }
> = {
  distanceWhole: { max: 99999, pad: 0 },
  distanceFractional: { max: 999, pad: 0 },
};

export const sanitizeDistanceField = (
  field: DistanceField,
  value: string,
): string => {
  const { max, pad } = DISTANCE_FIELD_LIMITS[field];
  return getValidatedInput(value, max, pad);
};

export const getNumericValue = (value: string) => {
  if (value && value.length > 0) {
    const intValue = Number(value);

    if (!Number.isNaN(intValue)) {
      return intValue;
    }
  }
  return 0;
};

export const getDecimalValue = (value: string) => {
  if (value && value.length > 0) {
    const decimalValue = Number.parseFloat(`0.${value.toString()}`);

    if (!Number.isNaN(decimalValue)) {
      return decimalValue;
    }
  }
  return 0;
};
