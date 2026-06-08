import { Time } from "pace-calculator";
import { sanitizeTime } from "./input";

export const timeToMs = (t: Time): number =>
  t.hours * 3600000 + t.minutes * 60000 + t.seconds * 1000 + t.milliseconds;

export const msToTime = (ms: number): Time => ({
  hours: Math.floor(ms / 3600000),
  minutes: Math.floor((ms / 60000) % 60),
  seconds: Math.floor((ms / 1000) % 60),
  milliseconds: Math.floor(ms % 1000),
});

export interface CalculatorTime {
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  /** Hundredths of a second (0–99). Multiply by 10 for pace-calculator's ms. */
  timeHundredths: string;
}

// Single source of truth for "time strings → ms". Route every conversion
// through here so the spinner bounds, applyTimeStep, and WR comparison stay
// aligned.
export const timeStringsToMs = (time: CalculatorTime): number =>
  (parseInt(time.timeHours) || 0) * 3600000 +
  (parseInt(time.timeMinutes) || 0) * 60000 +
  (parseInt(time.timeSeconds) || 0) * 1000 +
  (parseInt(time.timeHundredths || "0") || 0) * 10;

interface ApplyTimeStepParams {
  currentTime: CalculatorTime;
  steps: number;
  stepMs: number;
  maxMs: number;
}

// Spinner emits abstract step counts; the slice picks the unit (`stepMs`).
export const applyTimeStep = ({
  currentTime,
  steps,
  stepMs,
  maxMs,
}: ApplyTimeStepParams): CalculatorTime => {
  const totalMs = Math.max(
    0,
    Math.min(maxMs, timeStringsToMs(currentTime) + steps * stepMs),
  );

  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs / 60000) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);
  const hundredths = Math.floor((totalMs % 1000) / 10);

  return sanitizeTime({
    timeHours: hours.toString(),
    timeMinutes: minutes.toString(),
    timeSeconds: seconds.toString(),
    timeHundredths: hundredths.toString(),
  });
};

export function hasMeaningfulTime({
  timeHours,
  timeMinutes,
  timeSeconds,
  timeHundredths,
}: {
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  timeHundredths: string;
}): boolean {
  return (
    !!parseInt(timeHours || "0") ||
    !!parseInt(timeMinutes || "0") ||
    !!parseInt(timeSeconds || "0") ||
    !!parseInt(timeHundredths || "0")
  );
}
