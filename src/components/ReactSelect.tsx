import Select, { SingleValue, StylesConfig } from "react-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface ReactSelectProps {
  placeholder?: string;
  defaultValue?: SelectOption;
  options: SelectOption[];
  value?: SelectOption;
  onChange: (option: SingleValue<SelectOption>) => void;
  inputId: string;
}

// react-select renders with Emotion inline styles, so it ignores Bootstrap
// classes and `data-bs-theme`. Driving its colours from Bootstrap CSS variables
// makes it follow light/dark mode automatically, with no theme prop to thread.
const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base) => ({
    ...base,
    backgroundColor: "var(--bs-tertiary-bg)",
    borderColor: "var(--bs-border-color)",
    color: "var(--bs-body-color)",
    "&:hover": { borderColor: "var(--bs-border-color)" },
  }),
  singleValue: (base) => ({ ...base, color: "var(--bs-body-color)" }),
  input: (base) => ({ ...base, color: "var(--bs-body-color)" }),
  placeholder: (base) => ({ ...base, color: "var(--bs-secondary-color)" }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--bs-body-bg)",
    border: "1px solid var(--bs-border-color)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--bs-primary)"
      : state.isFocused
        ? "var(--bs-tertiary-bg)"
        : "var(--bs-body-bg)",
    color: state.isSelected ? "var(--bs-white)" : "var(--bs-body-color)",
  }),
};

const ReactSelect = ({
  options,
  defaultValue,
  placeholder,
  onChange,
  value,
  inputId,
}: ReactSelectProps) => (
  <Select
    options={options}
    isClearable={false}
    isSearchable={false}
    defaultValue={defaultValue}
    placeholder={placeholder}
    onChange={(val) => onChange(val as SingleValue<SelectOption>)}
    value={value}
    inputId={inputId}
    styles={selectStyles}
  />
);

export default ReactSelect;
