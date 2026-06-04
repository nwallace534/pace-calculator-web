import React, { MouseEventHandler } from "react";
import useCalculatorStore from "@/state/useCalculatorStore";
import useEventGuide from "@/hooks/useEventGuide";
import Dropdown from "@/components/Dropdown";
import { sanitizeTimeForEvent } from "@/utils/events";

const SampleTimes = () => {
  const { eventGuide } = useEventGuide();

  if (!eventGuide) {
    return null;
  }

  return (
    <>
      <Dropdown menu={<SampleTimesDropdown />}>
        <button
          type="button"
          className="btn btn-secondary badge dropdown-toggle"
        >
          {eventGuide.title}
        </button>
      </Dropdown>
    </>
  );
};

export default SampleTimes;

const SampleTimesDropdown = () => {
  const { eventGuide } = useEventGuide();
  const setFullTime = useCalculatorStore((state) => state.setFullTime);
  const currentEvent = useCalculatorStore((state) => state.event);

  if (!eventGuide) {
    return null;
  }

  const handleExampleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    const example = eventGuide.timeExamples.find(
      (timeExample) => timeExample.id === event.currentTarget.value,
    );
    if (example) {
      // Sample times can carry hidden precision (5K WR = 12:35.36 but the 5K
      // UI hides hundredths). Strip it so the calc matches what's on screen.
      const { timeHours, timeMinutes, timeSeconds, timeHundredths } =
        sanitizeTimeForEvent(example.time, currentEvent);
      setFullTime(timeHours, timeMinutes, timeSeconds, timeHundredths);
    }
  };

  return (
    <>
      {eventGuide.timeExamples.map((example) => (
        <button
          type="button"
          onClick={handleExampleClick}
          key={example.id}
          id={example.id}
          value={example.id}
          className="dropdown-item"
        >
          {example.label}
        </button>
      ))}
    </>
  );
};
