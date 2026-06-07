import { ChangeEvent, useRef } from "react";
import NumericInput from "@/components/NumericInput";
import endsWithSkipChar from "@/utils/ends-with-skip-char";

interface DistanceValueInputProps {
  whole: string;
  fractional: string;
  onWholeChange: (value: string) => void;
  onFractionalChange: (value: string) => void;
  wholeId?: string;
  fractionalId?: string;
  wholeCssClasses?: string;
  fractionalCssClasses?: string;
  placeholder?: string;
}

// Renders the two distance fields and the dot separator as a fragment so the
// caller controls the surrounding flex row (and what sits to the right — a
// unit picker, "meters" static text, etc.). Typing a skip char (".", ",")
// in the whole field jumps focus to the fractional field without committing
// the punctuation.
const DistanceValueInput = ({
  whole,
  fractional,
  onWholeChange,
  onFractionalChange,
  wholeId = "distance",
  fractionalId = "distanceDecimal",
  wholeCssClasses = "numeric-input-xl form-control-huge text-end",
  fractionalCssClasses = "numeric-input-lg form-control-huge text-start",
  placeholder = "00",
}: DistanceValueInputProps) => {
  const fractionalRef = useRef<HTMLInputElement>(null);

  const handleWholeChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (endsWithSkipChar(e.target.value)) {
      fractionalRef.current?.focus();
      return;
    }
    onWholeChange(e.target.value);
  };

  const handleFractionalChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (endsWithSkipChar(e.target.value)) return;
    onFractionalChange(e.target.value);
  };

  return (
    <>
      <NumericInput
        id={wholeId}
        cssClasses={wholeCssClasses}
        onChange={handleWholeChange}
        placeholder={placeholder}
        value={whole}
      />
      <div className="text-huge">.</div>
      <NumericInput
        id={fractionalId}
        cssClasses={fractionalCssClasses}
        onChange={handleFractionalChange}
        placeholder={placeholder}
        value={fractional}
        ref={fractionalRef}
      />
    </>
  );
};

export default DistanceValueInput;
