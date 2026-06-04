import { ChangeEvent, ChangeEventHandler, useMemo } from "react";
import React from "react";

import useCalculatorStore from "../state/useCalculatorStore";

import NumericInput from "@/components/NumericInput";
import ReactSelect, { SelectOption } from "@/components/ReactSelect";

import { SingleValue } from "react-select";
import { Events, EventTags } from "@/utils/events";
import endsWithSkipChar from "@/utils/ends-with-skip-char";
import { DistanceUnitOptions } from "@/utils/distances";
import { DistanceMode } from "@/types/distance";
import { DistanceUnit } from "pace-calculator";
import { useTranslation } from "react-i18next";
import useEventGuide from "@/hooks/useEventGuide";

const distanceDecimalInput = React.createRef<HTMLInputElement>();

function Distance() {
  const { t } = useTranslation(["events", "calculator"]);

  const { standardOptions, middleDistanceOptions, sprintOptions } =
    useMemo(() => {
      const standard: { value: string; label: string }[] = [];
      const middle: { value: string; label: string }[] = [];
      const sprints: { value: string; label: string }[] = [];

      Events.forEach((event) => {
        const option = { value: event.id, label: t(`event.${event.id}.label`) };
        if (event.eventTags.includes(EventTags.Standard)) {
          standard.push(option);
        }
        if (event.eventTags.includes(EventTags.MiddleDistance)) {
          middle.push(option);
        }
        if (event.eventTags.includes(EventTags.Sprints)) {
          sprints.push(option);
        }
      });

      return {
        standardOptions: standard,
        middleDistanceOptions: middle,
        sprintOptions: sprints,
      };
    }, [t]);

  const { eventGuide } = useEventGuide();

  const distance = useCalculatorStore((state) => state.distanceWhole);
  const distanceDecimal = useCalculatorStore(
    (state) => state.distanceFractional,
  );
  const distanceUnit = useCalculatorStore((state) => state.distanceUnit);
  const event = useCalculatorStore((state) => state.event);

  const setDistanceWhole = useCalculatorStore(
    (state) => state.setDistanceWhole,
  );
  const setDistanceFractional = useCalculatorStore(
    (state) => state.setDistanceFractional,
  );
  const setDistanceUnit = useCalculatorStore((state) => state.setDistanceUnit);
  const setEvent = useCalculatorStore((state) => state.setEvent);

  const handleDistanceChange = (event: ChangeEvent<HTMLInputElement>) => {
    let skip = true;
    if (!endsWithSkipChar(event.target.value)) {
      setDistanceWhole(event.target.value);
      skip = false;
    }

    if (skip) {
      if (distanceDecimalInput && distanceDecimalInput.current) {
        distanceDecimalInput.current.focus();
      }
    }
  };

  const handleDistanceDecimalChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (!endsWithSkipChar(event.target.value)) {
      setDistanceFractional(event.target.value);
    }
  };

  const handleEventSelect: ChangeEventHandler<HTMLSelectElement> = (option) => {
    const id = option.target.value as string;

    if (id) {
      setEvent(id);
    }
  };

  const handleDistanceUnitsSelect = (option: SingleValue<SelectOption>) => {
    const selectDistanceUnit = option?.value || DistanceUnit.Kilometers;
    const distanceUnit = selectDistanceUnit as DistanceUnit;
    setDistanceUnit(distanceUnit);
  };

  return (
    <div className="row">
      <div className="col-md-6">
        <label className="form-label" htmlFor="labelDistance">
          {t("calculator:selectedRunDistance")}
        </label>
      </div>
      <div className="col-md-6">
        <select
          className="form-select border-secondary shadow-sm"
          value={event}
          onChange={handleEventSelect}
          id="labelDistance"
        >
          <optgroup label={t("calculator:eventGroup.mostPopular")}>
            {standardOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value={DistanceMode.Custom}>
              {t("calculator:customDistance")}
            </option>
          </optgroup>

          <optgroup label={t("calculator:eventGroup.middleDistance")}>
            {middleDistanceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>

          <optgroup label={t("calculator:eventGroup.sprints")}>
            {sprintOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value={DistanceMode.CustomTrack}>
              {t("calculator:customTrackDistance")}
            </option>
          </optgroup>
        </select>
        {(event === DistanceMode.Custom ||
          event === DistanceMode.CustomTrack) && (
          <div className="d-flex justify-content-center mt-2">
            <div className="d-flex align-items-end">
              <NumericInput
                id="distance"
                cssClasses="numeric-input-xl form-control-huge text-end"
                onChange={handleDistanceChange}
                placeholder="00"
                value={distance}
              />
              <div className="text-huge">.</div>
              <NumericInput
                id="distanceDecimal"
                cssClasses="numeric-input-lg form-control-huge text-start"
                onChange={handleDistanceDecimalChange}
                placeholder="00"
                value={distanceDecimal}
                ref={distanceDecimalInput}
              />
              <div className="ms-2 align-self-center">
                {event === DistanceMode.CustomTrack ? (
                  // Track mode is meters-only — render as static text so it
                  // doesn't look like a disabled-but-interactive dropdown.
                  <span className="fs-5">meters</span>
                ) : (
                  <div className="distance-unit">
                    <ReactSelect
                      options={DistanceUnitOptions.filter(
                        (option) => option.value !== DistanceUnit.Meters,
                      )}
                      onChange={handleDistanceUnitsSelect}
                      value={
                        DistanceUnitOptions.filter(
                          (option) => option.value === distanceUnit,
                        )[0]
                      }
                      inputId="labelDistanceUnit"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {eventGuide && (
          <div
            className="mt-2"
            dangerouslySetInnerHTML={{ __html: eventGuide.description }}
          />
        )}
      </div>
    </div>
  );
}

export default Distance;
