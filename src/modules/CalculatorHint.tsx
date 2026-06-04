import { useTranslation } from "react-i18next";
import useCalculatorStore from "@/state/useCalculatorStore";
import { getFastestRecordPace } from "@/utils/events";
import { getDecimalValue, getNumericValue } from "@/utils/input";

function CalculatorHint() {
  const { t } = useTranslation("calculator");
  const event = useCalculatorStore((state) => state.event);
  const distanceWhole = useCalculatorStore((state) => state.distanceWhole);
  const distanceFractional = useCalculatorStore(
    (state) => state.distanceFractional,
  );
  const allDistances = useCalculatorStore((state) => state.allDistances);
  const timeHours = useCalculatorStore((state) => state.timeHours);
  const timeMinutes = useCalculatorStore((state) => state.timeMinutes);
  const timeSeconds = useCalculatorStore((state) => state.timeSeconds);
  const timeHundredths = useCalculatorStore((state) => state.timeHundredths);

  const distanceEntered =
    getNumericValue(distanceWhole) + getDecimalValue(distanceFractional) > 0;
  const timeMs =
    getNumericValue(timeHours) * 3600000 +
    getNumericValue(timeMinutes) * 60000 +
    getNumericValue(timeSeconds) * 1000 +
    getNumericValue(timeHundredths) * 10;
  const timeEntered = timeMs > 0;

  // Priority: missing distance > missing time > faster-than-WR.
  let variant: "info" | "warning" | null = null;
  let message = "";

  if (!distanceEntered) {
    variant = "info";
    message = t("result.needsDistance");
  } else if (!timeEntered) {
    variant = "info";
    message = t("result.needsTime");
  } else {
    // Compare in s/km so the check works for any event including Custom.
    const distanceMeters = allDistances?.inMeters.distanceValue ?? 0;
    const userPaceSecPerKm = distanceMeters > 0 ? timeMs / distanceMeters : 0;

    const recordPace = getFastestRecordPace(event, distanceMeters);
    if (
      recordPace &&
      userPaceSecPerKm > 0 &&
      userPaceSecPerKm < recordPace.secPerKm
    ) {
      variant = "warning";
      message = t("result.fasterThanRecordPace");
    }
  }

  if (!variant) return null;

  return (
    <div className={`alert alert-${variant} py-2 small mb-0`} role="status">
      {message}
    </div>
  );
}

export default CalculatorHint;
