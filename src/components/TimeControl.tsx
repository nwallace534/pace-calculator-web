import { ChangeEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import NumericInput from "@/components/NumericInput";
import SpinnerButton from "@/components/SpinnerButton";
import WithLabel from "@/components/WithLabel";
import { SpinnerType } from "@/types/spinner";
import endsWithSkipChar from "@/utils/ends-with-skip-char";

type SpinnerTuning = {
  minRate?: number;
  maxRate?: number;
};

type TimeControlProps = {
  ids: {
    hours: string;
    minutes: string;
    seconds: string;
    hundredths: string;
  };
  values: {
    hours: string;
    minutes: string;
    seconds: string;
    hundredths: string;
  };
  showHours: boolean;
  showMinutes: boolean;
  showHundredths: boolean;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  onSecondsChange: (value: string) => void;
  onHundredthsChange: (value: string) => void;
  onStep: (steps: number) => void;
  onTap?: () => boolean;
  onHold?: () => void;
  hintLabel?: string;
  decreaseAriaLabel: string;
  increaseAriaLabel: string;
  atMin: boolean;
  atMax: boolean;
  tuning?: SpinnerTuning;
};

function TimeControl({
  ids,
  values,
  showHours,
  showMinutes,
  showHundredths,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
  onHundredthsChange,
  onStep,
  onTap,
  onHold,
  hintLabel,
  decreaseAriaLabel,
  increaseAriaLabel,
  atMin,
  atMax,
  tuning,
}: TimeControlProps) {
  const { t } = useTranslation("calculator");
  const hoursInput = useRef<HTMLInputElement>(null);
  const minuteInput = useRef<HTMLInputElement>(null);
  const secondsInput = useRef<HTMLInputElement>(null);
  const hundredthsInput = useRef<HTMLInputElement>(null);

  const makeFieldChangeHandler =
    (fieldId: string, setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const focusChain = [
        { id: ids.hours, visible: showHours },
        { id: ids.minutes, visible: showMinutes },
        { id: ids.seconds, visible: true },
        { id: ids.hundredths, visible: showHundredths },
      ];
      const idx = focusChain.findIndex((f) => f.id === fieldId);
      const next = focusChain.slice(idx + 1).find((f) => f.visible);
      const current = document.getElementById(fieldId) as HTMLInputElement;

      if (endsWithSkipChar(value)) {
        if (next) {
          document.getElementById(next.id)?.focus();
        } else {
          current?.blur();
          current?.focus();
        }
        return;
      }

      setter(value);

      if (value.length > 1) {
        if (next) {
          document.getElementById(next.id)?.focus();
        } else {
          current?.blur();
        }
      }
    };

  return (
    <div className="d-flex align-items-end justify-content-center">
      <div className="me-2">
        <SpinnerButton
          type={SpinnerType.Down}
          onStep={onStep}
          onTap={onTap}
          onHold={onHold}
          hintLabel={hintLabel}
          ariaLabel={decreaseAriaLabel}
          disabled={atMin}
          tuning={tuning}
        />
      </div>

      <div className="d-flex align-items-end justify-content-center">
        {showHours && (
          <>
            <div className="col flex-grow-0">
              <WithLabel id={ids.hours} name={t("timeUnit.hours")}>
                <NumericInput
                  id={ids.hours}
                  placeholder="00"
                  cssClasses="numeric-input-md form-control-huge text-left"
                  onChange={makeFieldChangeHandler(ids.hours, onHoursChange)}
                  value={values.hours}
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
              <WithLabel id={ids.minutes} name={t("timeUnit.minutes")}>
                <NumericInput
                  id={ids.minutes}
                  placeholder="00"
                  cssClasses="numeric-input-md form-control-huge"
                  onChange={makeFieldChangeHandler(
                    ids.minutes,
                    onMinutesChange,
                  )}
                  value={values.minutes}
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
          <WithLabel id={ids.seconds} name={t("timeUnit.seconds")}>
            <NumericInput
              id={ids.seconds}
              placeholder="00"
              cssClasses="numeric-input-md form-control-huge text-left"
              onChange={makeFieldChangeHandler(ids.seconds, onSecondsChange)}
              value={values.seconds}
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
              <WithLabel id={ids.hundredths} name={t("timeUnit.hundredths")}>
                <NumericInput
                  id={ids.hundredths}
                  placeholder="00"
                  cssClasses="numeric-input-md form-control-huge text-left"
                  onChange={makeFieldChangeHandler(
                    ids.hundredths,
                    onHundredthsChange,
                  )}
                  value={values.hundredths}
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
          onStep={onStep}
          onTap={onTap}
          onHold={onHold}
          hintLabel={hintLabel}
          ariaLabel={increaseAriaLabel}
          disabled={atMax}
          tuning={tuning}
        />
      </div>
    </div>
  );
}

export default TimeControl;
