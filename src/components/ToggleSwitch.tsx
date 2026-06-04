import "./ToggleSwitch.css";
import React from "react";

type ToggleSwitchProps = {
  isOn: boolean;
  onToggle: () => void;
  ariaLabel: string;
  id: string;
};

export const ToggleSwitch = ({
  isOn,
  onToggle,
  ariaLabel,
  id,
}: ToggleSwitchProps) => {
  return (
    <button
      onClick={onToggle}
      className={`toggle-switch ${isOn ? "checked" : ""}`}
      aria-label={ariaLabel}
      id={id}
    >
      <div className="toggle-knob" />
    </button>
  );
};
