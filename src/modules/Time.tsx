import { useTranslation } from "react-i18next";
import useCalculatorStore from "@/state/useCalculatorStore";
import { getMaxTimeMs, getStepMs, getVisibleTimeFields } from "@/utils/events";
import { timeStringsToMs } from "@/utils/time";
import SampleTimes from "./SampleTimes";
import CalculatorHint from "./CalculatorHint";
import TimeControl from "@/components/TimeControl";

function Time() {
  const { t } = useTranslation("calculator");
  const hours = useCalculatorStore((state) => state.timeHours);
  const minutes = useCalculatorStore((state) => state.timeMinutes);
  const seconds = useCalculatorStore((state) => state.timeSeconds);
  const hundredths = useCalculatorStore((state) => state.timeHundredths);

  const setTimeHours = useCalculatorStore((state) => state.setTimeHours);
  const setTimeMinutes = useCalculatorStore((state) => state.setTimeMinutes);
  const setTimeSeconds = useCalculatorStore((state) => state.setTimeSeconds);
  const setTimeHundredths = useCalculatorStore(
    (state) => state.setTimeHundredths,
  );
  const incrementTime = useCalculatorStore((state) => state.incrementTime);
  const registerSpinnerTap = useCalculatorStore(
    (state) => state.registerSpinnerTap,
  );
  const registerSpinnerHold = useCalculatorStore(
    (state) => state.registerSpinnerHold,
  );

  const event = useCalculatorStore((state) => state.event);
  const { showHours, showMinutes, showHundredths } =
    getVisibleTimeFields(event);

  // Disable the spinner ends at the event's bounds so a held button can't
  // pile up clamped no-op steps.
  const currentMs = timeStringsToMs({
    timeHours: hours,
    timeMinutes: minutes,
    timeSeconds: seconds,
    timeHundredths: hundredths,
  });
  const atMin = currentMs <= 0;
  const atMax = currentMs >= getMaxTimeMs(event);

  // Sub-second-step events need a faster spinner to traverse the same wall
  // time in comparable feel — defaults are tuned for 1s steps.
  const stepMs = getStepMs(event);
  const spinnerTuning =
    stepMs < 1000 ? { minRate: 100, maxRate: 1500 } : undefined;

  return (
    <div>
      <div className="d-flex align-items-baseline justify-content-between">
        <label>{t("runDuration")}</label>
        <SampleTimes />
      </div>
      <div className="mt-2">
        <TimeControl
          ids={{
            hours: "hours",
            minutes: "minutes",
            seconds: "seconds",
            hundredths: "hundredths",
          }}
          values={{ hours, minutes, seconds, hundredths }}
          showHours={showHours}
          showMinutes={showMinutes}
          showHundredths={showHundredths}
          onHoursChange={setTimeHours}
          onMinutesChange={setTimeMinutes}
          onSecondsChange={setTimeSeconds}
          onHundredthsChange={setTimeHundredths}
          onStep={incrementTime}
          onTap={registerSpinnerTap}
          onHold={registerSpinnerHold}
          hintLabel={t("holdHint")}
          decreaseAriaLabel={t("decreaseTimeAriaLabel")}
          increaseAriaLabel={t("increaseTimeAriaLabel")}
          atMin={atMin}
          atMax={atMax}
          tuning={spinnerTuning}
        />
      </div>
      <div className="mt-3">
        <CalculatorHint />
      </div>
    </div>
  );
}

export default Time;
