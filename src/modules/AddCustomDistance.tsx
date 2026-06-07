import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DistanceUnit } from "pace-calculator";
import BottomSheet from "@/components/BottomSheet";
import DistanceValueInput from "@/components/DistanceValueInput";
import SheetActions from "@/components/SheetActions";
import { DistanceUnitOptions } from "@/utils/distances";
import {
  getDecimalValue,
  getNumericValue,
  getValidatedInput,
} from "@/utils/input";
import useCalculatorStore from "@/state/useCalculatorStore";
import { SAVED_DISTANCE_CAP } from "@/state/savedDistancesSlice";

const defaultSavedDistanceInput = {
  whole: "00",
  fractional: "00",
};

function AddCustomDistance() {
  const { t } = useTranslation(["events", "calculator"]);
  const savedDistances = useCalculatorStore((state) => state.savedDistances);
  const addSavedDistance = useCalculatorStore(
    (state) => state.addSavedDistance,
  );
  const [open, setOpen] = useState(false);
  const [whole, setWhole] = useState(defaultSavedDistanceInput.whole);
  const [fractional, setFractional] = useState(
    defaultSavedDistanceInput.fractional,
  );
  const [unit, setUnit] = useState<DistanceUnit>(DistanceUnit.Kilometers);
  const [error, setError] = useState<string | null>(null);

  const atCap = savedDistances.length >= SAVED_DISTANCE_CAP;

  const reset = () => {
    setWhole(defaultSavedDistanceInput.whole);
    setFractional(defaultSavedDistanceInput.fractional);
    setUnit(DistanceUnit.Kilometers);
    setError(null);
  };

  const handleSave = () => {
    const distanceValue = getNumericValue(whole) + getDecimalValue(fractional);
    const result = addSavedDistance({
      distanceValue,
      distanceUnit: unit,
    });
    if (result.ok) {
      setOpen(false);
      reset();
      return;
    }
    switch (result.reason) {
      case "invalid":
        setError(t("calculator:timesForPace.form.errorEmpty"));
        break;
      case "duplicate-builtin": {
        const label = result.matchedBuiltInId
          ? t(`events:event.${result.matchedBuiltInId}.label`)
          : "";
        setError(
          t("calculator:timesForPace.form.errorDuplicateBuiltIn", { label }),
        );
        break;
      }
      case "duplicate-saved":
        setError(t("calculator:timesForPace.form.errorDuplicateSaved"));
        break;
      case "limit":
        setError(t("calculator:timesForPace.addCustomLimitReached"));
        break;
    }
  };

  const handleCancel = () => {
    setOpen(false);
    reset();
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-baseline gap-2 mt-2">
        <button
          type="button"
          className="btn btn-link btn-link-muted p-0"
          disabled={atCap}
          onClick={() => setOpen(true)}
        >
          {t("calculator:timesForPace.addCustom")}
        </button>
        {atCap && (
          <span className="text-muted text-smallish">
            {t("calculator:timesForPace.addCustomLimitReached")}
          </span>
        )}
      </div>
      {open && (
        <AddCustomDistanceSheet
          whole={whole}
          fractional={fractional}
          unit={unit}
          error={error}
          onWholeChange={setWhole}
          onFractionalChange={setFractional}
          onUnitChange={setUnit}
          onSave={handleSave}
          onClose={handleCancel}
        />
      )}
    </>
  );
}

interface SheetProps {
  whole: string;
  fractional: string;
  unit: DistanceUnit;
  error: string | null;
  onWholeChange: (value: string) => void;
  onFractionalChange: (value: string) => void;
  onUnitChange: (value: DistanceUnit) => void;
  onSave: () => void;
  onClose: () => void;
}

function AddCustomDistanceSheet({
  whole,
  fractional,
  unit,
  error,
  onWholeChange,
  onFractionalChange,
  onUnitChange,
  onSave,
  onClose,
}: SheetProps) {
  const { t } = useTranslation(["events", "calculator"]);
  return (
    <BottomSheet
      title={t("calculator:timesForPace.addCustomTitle")}
      closeAriaLabel={t("calculator:timesForPace.closeAriaLabel")}
      onClose={onClose}
      maxWidth="480px"
    >
      <div className="d-flex align-items-center">
        <DistanceValueInput
          whole={whole}
          fractional={fractional}
          onWholeChange={(value) =>
            onWholeChange(getValidatedInput(value, 99999, 0))
          }
          onFractionalChange={(value) =>
            onFractionalChange(getValidatedInput(value, 999, 0))
          }
          wholeId="savedDistanceWhole"
          fractionalId="savedDistanceFractional"
        />
        <div className="distance-unit ms-2">
          <select
            id="savedDistanceUnit"
            className="form-select"
            value={unit}
            onChange={(event) =>
              onUnitChange(event.target.value as DistanceUnit)
            }
          >
            {DistanceUnitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <SheetActions
        error={error}
        cancelLabel={t("calculator:timesForPace.form.cancel")}
        saveLabel={t("calculator:timesForPace.form.save")}
        onCancel={onClose}
        onSave={onSave}
      />
    </BottomSheet>
  );
}

export default AddCustomDistance;
