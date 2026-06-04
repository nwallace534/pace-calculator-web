import { Time } from "pace-calculator";

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
