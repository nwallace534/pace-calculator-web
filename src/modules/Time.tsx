import { ChangeEvent } from "react";
import React from "react";
import { useTranslation } from "react-i18next";
import NumericInput from "../components/NumericInput";
import WithLabel from "@/components/WithLabel";
import SpinnerButton from "@/components/SpinnerButton";
import { SpinnerType } from "@/types/spinner";
import useCalculatorStore from "@/state/useCalculatorStore";
import endsWithSkipChar from "@/utils/ends-with-skip-char";
import { getMaxTimeMs, getStepMs, getVisibleTimeFields } from "@/utils/events";
import { timeStringsToMs } from "@/utils/time";
import SampleTimes from "./SampleTimes";

const hoursInput = React.createRef<HTMLInputElement>();
const minuteInput = React.createRef<HTMLInputElement>();
const secondsInput = React.createRef<HTMLInputElement>();
const hundredthsInput = React.createRef<HTMLInputElement>();

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

  // The change handler below walks this chain to pick the next focus target,
  // so hiding a field just skips over it without per-handler logic.
  const focusChain = [
    { id: "hours", ref: hoursInput, visible: showHours },
    { id: "minutes", ref: minuteInput, visible: showMinutes },
    { id: "seconds", ref: secondsInput, visible: true },
    { id: "hundredths", ref: hundredthsInput, visible: showHundredths },
  ];

  // Skip char or 2+ chars → advance to the next visible field, or blur/refocus
  // self on the last field.
  const makeFieldChangeHandler =
    (fieldId: string, setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const idx = focusChain.findIndex((f) => f.id === fieldId);
      const next = focusChain.slice(idx + 1).find((f) => f.visible);
      const current = focusChain[idx]?.ref.current;

      if (endsWithSkipChar(value)) {
        if (next) {
          next.ref.current?.focus();
        } else {
          current?.blur();
          current?.focus();
        }
        return;
      }

      setter(value);

      if (value.length > 1) {
        if (next) {
          next.ref.current?.focus();
        } else {
          current?.blur();
        }
      }
    };

  const handleHoursChange = makeFieldChangeHandler("hours", setTimeHours);
  const handleMinutesChange = makeFieldChangeHandler("minutes", setTimeMinutes);
  const handleSecondsChange = makeFieldChangeHandler("seconds", setTimeSeconds);
  const handleHundredthsChange = makeFieldChangeHandler(
    "hundredths",
    setTimeHundredths,
  );

  return (
    <div className="row align-items-baseline">
      <div className="col-6">
        <label>{t("runDuration")}</label>
      </div>
      <div className="col-6 justify-content-end d-flex">
        <SampleTimes />
      </div>
      <div className="col-md-6 d-none d-md-block"></div>
      <div className="col-md-6 mt-2">
        <div className="d-flex align-items-end justify-content-center">
          <div className="me-2">
            <SpinnerButton
              type={SpinnerType.Down}
              onStep={incrementTime}
              onTap={registerSpinnerTap}
              onHold={registerSpinnerHold}
              hintLabel={t("holdHint")}
              ariaLabel={t("decreaseTimeAriaLabel")}
              disabled={atMin}
              tuning={spinnerTuning}
            />
          </div>

          <div className="d-flex align-items-end justify-content-center">
            {showHours && (
              <>
                <div className="col flex-grow-0">
                  <WithLabel id="hours" name={t("timeUnit.hours")}>
                    <NumericInput
                      id="hours"
                      placeholder="00"
                      cssClasses="numeric-input-md form-control-huge text-left"
                      onChange={handleHoursChange}
                      value={hours}
                      ref={hoursInput}
                    />
                  </WithLabel>
                </div>
                <div className="col flex-grow-0 text-huge">
                  <div className="mb-1">:</div>
                </div>
              </>
            )}

            {showMinutes && (
              <>
                <div className="col flex-grow-0">
                  <WithLabel id="minutes" name={t("timeUnit.minutes")}>
                    <NumericInput
                      id="minutes"
                      placeholder="00"
                      cssClasses="numeric-input-md form-control-huge"
                      onChange={handleMinutesChange}
                      value={minutes}
                      ref={minuteInput}
                    />
                  </WithLabel>
                </div>
                <div className="col flex-grow-0 text-huge">
                  <div className="mb-1">:</div>
                </div>
              </>
            )}
            <div className="col flex-grow-0">
              <WithLabel id="seconds" name={t("timeUnit.seconds")}>
                <NumericInput
                  id="seconds"
                  placeholder="00"
                  cssClasses="numeric-input-md form-control-huge text-left"
                  onChange={handleSecondsChange}
                  value={seconds}
                  ref={secondsInput}
                />
              </WithLabel>
            </div>

            {showHundredths && (
              <>
                <div className="col flex-grow-0 text-huge">
                  <div className="mb-1">.</div>
                </div>
                <div className="col flex-grow-0">
                  <WithLabel id="hundredths" name={t("timeUnit.hundredths")}>
                    <NumericInput
                      id="hundredths"
                      placeholder="00"
                      cssClasses="numeric-input-md form-control-huge text-left"
                      onChange={handleHundredthsChange}
                      value={hundredths}
                      ref={hundredthsInput}
                    />
                  </WithLabel>
                </div>
              </>
            )}
          </div>
          <div className="ms-2">
            <SpinnerButton
              type={SpinnerType.Up}
              onStep={incrementTime}
              onTap={registerSpinnerTap}
              onHold={registerSpinnerHold}
              hintLabel={t("holdHint")}
              ariaLabel={t("increaseTimeAriaLabel")}
              disabled={atMax}
              tuning={spinnerTuning}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Time;
