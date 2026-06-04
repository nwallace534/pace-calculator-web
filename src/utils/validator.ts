import { Time } from "pace-calculator";

export const hasTimeValue = (time: Partial<Time>): boolean => {
  const timeValues = [
    time.hours ?? 0,
    time.minutes ?? 0,
    time.seconds ?? 0,
    time.milliseconds ?? 0,
  ];

  if (timeValues.some((v) => v < 0) || timeValues.every((v) => v === 0)) {
    return false;
  }

  return true;
};
