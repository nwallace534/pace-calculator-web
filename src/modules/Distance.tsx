import { ChangeEventHandler, useMemo } from "react";

import useCalculatorStore from "../state/useCalculatorStore";

import DistanceValueInput from "@/components/DistanceValueInput";

import { Events, EventTags } from "@/utils/events";
import { DistanceUnitOptions } from "@/utils/distances";
import { DistanceMode } from "@/types/distance";
import { DistanceUnit } from "pace-calculator";
import { useTranslation } from "react-i18next";
import useEventGuide from "@/hooks/useEventGuide";

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

  const handleEventSelect: ChangeEventHandler<HTMLSelectElement> = (option) => {
    const id = option.target.value as string;

    if (id) {
      setEvent(id);
    }
  };

  const handleDistanceUnitsSelect: ChangeEventHandler<HTMLSelectElement> = (
    e,
  ) => {
    setDistanceUnit(e.target.value as DistanceUnit);
  };

  return (
    <div>
      <label className="form-label" htmlFor="labelDistance">
        {t("calculator:selectedRunDistance")}
      </label>
      <div>
        <select
          className="form-select border-secondary shadow-sm"
          style={{ cursor: "pointer" }}
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
            <div className="d-flex align-items-center">
              <DistanceValueInput
                whole={distance}
                fractional={distanceDecimal}
                onWholeChange={setDistanceWhole}
                onFractionalChange={setDistanceFractional}
              />
              <div className="ms-2">
                {event === DistanceMode.CustomTrack ? (
                  // Track mode is meters-only — render as static text so it
                  // doesn't look like a disabled-but-interactive dropdown.
                  <span className="fs-5">meters</span>
                ) : (
                  <div className="distance-unit">
                    <select
                      id="labelDistanceUnit"
                      className="form-select"
                      value={distanceUnit}
                      onChange={handleDistanceUnitsSelect}
                    >
                      {DistanceUnitOptions.filter(
                        (option) => option.value !== DistanceUnit.Meters,
                      ).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
