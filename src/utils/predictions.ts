import { Time } from "pace-calculator";
import { msToTime, timeToMs } from "./time";

const RIEGEL_EXPONENT = 1.06;
const MIN_PREDICTION_DISTANCE_METERS = 800;

export const predictRaceTime = ({
  inputTime,
  inputMeters,
  targetMeters,
}: {
  inputTime: Time;
  inputMeters: number;
  targetMeters: number;
}): Time | null => {
  if (
    inputMeters < MIN_PREDICTION_DISTANCE_METERS ||
    targetMeters < MIN_PREDICTION_DISTANCE_METERS
  ) {
    return null;
  }

  const inputMs = timeToMs(inputTime);
  if (inputMs <= 0 || inputMeters <= 0 || targetMeters <= 0) return null;

  return msToTime(
    inputMs * Math.pow(targetMeters / inputMeters, RIEGEL_EXPONENT),
  );
};
