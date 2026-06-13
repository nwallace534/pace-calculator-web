import { Time } from "pace-calculator";

import { timeToMs } from "./time";

// Track-summary friendly format used by both the main splits panel and the
// summary card: "78 seconds" when under 90s (where the natural-language form
// reads clearer), else the standard MM:SS / HH:MM:SS clock format. Caller
// supplies the localised "seconds" word so this utility stays i18n-agnostic.
export const formatNaturalDuration = (
  time: Time,
  secondsLabel: string,
): string => {
  const totalSeconds = Math.floor(timeToMs(time) / 1000);
  if (totalSeconds < 90) {
    return `${totalSeconds} ${secondsLabel}`;
  }
  return formatTime({ time });
};

export function formatTime({
  time,
  alwaysShowHours = false,
  showHundredths = false,
}: {
  time: Time;
  alwaysShowHours?: boolean;
  showHundredths?: boolean;
}) {
  const { hours, minutes, seconds, milliseconds } = time;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const tail = showHundredths
    ? `.${String(Math.floor(milliseconds / 10)).padStart(2, "0")}`
    : "";

  if (!alwaysShowHours && hours === 0) {
    return `${mm}:${ss}${tail}`;
  }

  return `${hh}:${mm}:${ss}${tail}`;
}
