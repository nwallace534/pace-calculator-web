import React, { ChangeEvent } from "react";

interface NumericInput {
  id: string;
  placeholder: string;
  cssClasses: string;
  value: string;
  readOnly?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const onFocus = (event: {
  persist: () => void;
  target: { setSelectionRange: (arg0: number, arg1: number) => void };
}) => {
  event.persist();
  setTimeout(() => event.target.setSelectionRange(0, 9999), 0);
};

const NumericInput = React.forwardRef<HTMLInputElement, NumericInput>(
  (
    {
      id,
      placeholder,
      cssClasses,
      value,
      readOnly = false,
      onChange,
    }: NumericInput,
    ref,
  ) => (
    <input
      id={id}
      // `name` is set to something deliberately un-credential-like so
      // browser autofill heuristics don't match it as a card/login field.
      name={`pc-${id}`}
      onFocus={onFocus}
      onChange={onChange}
      pattern="[0-9]*"
      type="text"
      placeholder={placeholder}
      inputMode="decimal"
      ref={ref}
      className={`form-control border-secondary shadow-sm ${cssClasses} ${
        readOnly ? "border-0 numeric-input-disabled" : ""
      } `}
      value={value}
      disabled={readOnly}
      autoComplete="off"
      // Opt out of the popular password managers explicitly — they ignore
      // autoComplete="off" but respect their own escape-hatch attributes.
      data-1p-ignore
      data-lpignore="true"
      data-form-type="other"
    />
  ),
);

NumericInput.displayName = "NumericInput";

export default NumericInput;
