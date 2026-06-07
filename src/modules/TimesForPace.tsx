import { useState } from "react";
import useCalculatorStore from "@/state/useCalculatorStore";
import {
  DISTANCE_MATCH_TOLERANCE_METERS,
  DistanceUnitOptions,
  DistanceUnitShortLabel,
  formatDistanceValue,
} from "@/utils/distances";
import {
  getDecimalValue,
  getNumericValue,
  getValidatedInput,
} from "@/utils/input";
import {
  eventDistancesInMeters,
  getDistanceInMetersForId,
} from "@/utils/events";
import { formatTime } from "@/utils/formatTime";
import { DistanceMode } from "@/types/distance";
import { useTranslation } from "react-i18next";
import { DistanceUnit, getDistanceInAllUnits, Time } from "pace-calculator";
import DistanceValueInput from "@/components/DistanceValueInput";
import { SAVED_DISTANCE_CAP } from "@/state/savedDistancesSlice";
import BottomSheet from "@/components/BottomSheet";
import SheetActions from "@/components/SheetActions";

type TimesForPaceRow = {
  id: string;
  label: string;
  time: Time;
  highlight: boolean;
  isSaved: boolean;
};

function TimesForPace({ results }: { results: Record<string, Time> | null }) {
  const { t } = useTranslation(["events", "calculator"]);
  const event = useCalculatorStore((state) => state.event);
  const distanceWhole = useCalculatorStore((state) => state.distanceWhole);
  const distanceFractional = useCalculatorStore(
    (state) => state.distanceFractional,
  );
  const distanceUnit = useCalculatorStore((state) => state.distanceUnit);
  const timeHours = useCalculatorStore((state) => state.timeHours);
  const timeMinutes = useCalculatorStore((state) => state.timeMinutes);
  const timeSeconds = useCalculatorStore((state) => state.timeSeconds);
  const timeHundredths = useCalculatorStore((state) => state.timeHundredths);
  const savedDistances = useCalculatorStore((state) => state.savedDistances);
  const removeSavedDistance = useCalculatorStore(
    (state) => state.removeSavedDistance,
  );

  let customRow: TimesForPaceRow | null = null;
  let customMeters = 0;
  let highlightId: string = event;

  const isCustomMode =
    event === DistanceMode.Custom || event === DistanceMode.CustomTrack;

  if (isCustomMode) {
    const customDistanceValue =
      getNumericValue(distanceWhole) + getDecimalValue(distanceFractional);
    const meters = getDistanceInAllUnits({
      distanceValue: customDistanceValue,
      distanceUnit,
    }).inMeters.distanceValue;

    const matchedEventId = Object.entries(eventDistancesInMeters).find(
      ([, m]) => Math.abs(m - meters) < DISTANCE_MATCH_TOLERANCE_METERS,
    )?.[0];

    const matchedSavedId = matchedEventId
      ? null
      : savedDistances.find(
          (s) =>
            Math.abs(
              getDistanceInAllUnits({
                distanceValue: s.distanceValue,
                distanceUnit: s.distanceUnit,
              }).inMeters.distanceValue - meters,
            ) < DISTANCE_MATCH_TOLERANCE_METERS,
        )?.id;

    if (matchedEventId) {
      highlightId = matchedEventId;
    } else if (matchedSavedId) {
      highlightId = `saved:${matchedSavedId}`;
    } else {
      customMeters = meters;
      const unitLabel = DistanceUnitShortLabel[distanceUnit];
      customRow = {
        id: event,
        label: `${formatDistanceValue(customDistanceValue)}${unitLabel}`,
        time: {
          hours: getNumericValue(timeHours),
          minutes: getNumericValue(timeMinutes),
          seconds: getNumericValue(timeSeconds),
          // hundredths field is centiseconds → ×10 for library ms.
          milliseconds: getNumericValue(timeHundredths) * 10,
        },
        highlight: true,
        isSaved: false,
      };
    }
  }

  const rows: TimesForPaceRow[] = [];
  if (results) {
    let inserted = false;
    for (const [id, time] of Object.entries(results)) {
      if (
        customRow &&
        !inserted &&
        getDistanceInMetersForId(id, savedDistances) > customMeters
      ) {
        rows.push(customRow);
        inserted = true;
      }
      const isSaved = id.startsWith("saved:");
      let label: string;
      if (isSaved) {
        const saved = savedDistances.find((s) => `saved:${s.id}` === id);
        // Defensive: results and savedDistances are read from the same store
        // snapshot so they should agree, but skip safely if a stale entry
        // ever appears.
        if (!saved) continue;
        label = `${formatDistanceValue(saved.distanceValue)}${DistanceUnitShortLabel[saved.distanceUnit]}`;
      } else {
        label = t(`event.${id}.label`);
      }
      rows.push({
        id,
        label,
        time,
        highlight: id === highlightId,
        isSaved,
      });
    }
    if (customRow && !inserted) {
      rows.push(customRow);
    }
  }

  return (
    <div>
      <table className="align-middle mt-2 w-100">
        <thead>
          <tr>
            <th className="w-50">{t("calculator:result.columnDistance")}</th>
            <th className="w-50">{t("calculator:result.columnTime")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.highlight ? "fw-bold" : undefined}>
              <td className={row.highlight ? "fs-5" : undefined}>
                {row.label}
                {row.isSaved && (
                  <button
                    type="button"
                    className="badge rounded-pill text-bg-secondary ms-2 border-0"
                    aria-label={t("calculator:timesForPace.removeAriaLabel")}
                    onClick={() => {
                      removeSavedDistance(row.id.slice("saved:".length));
                    }}
                  >
                    {t("calculator:timesForPace.savedBadge")}
                    <span aria-hidden="true" className="ms-1">
                      ×
                    </span>
                  </button>
                )}
              </td>
              <td className="output fs-6">
                {formatTime({ time: row.time, alwaysShowHours: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddCustomDistance />
    </div>
  );
}

function AddCustomDistance() {
  const { t } = useTranslation(["events", "calculator"]);
  const savedDistances = useCalculatorStore((state) => state.savedDistances);
  const addSavedDistance = useCalculatorStore(
    (state) => state.addSavedDistance,
  );
  const [open, setOpen] = useState(false);
  const [whole, setWhole] = useState("");
  const [fractional, setFractional] = useState("");
  const [unit, setUnit] = useState<DistanceUnit>(DistanceUnit.Kilometers);
  const [error, setError] = useState<string | null>(null);

  const atCap = savedDistances.length >= SAVED_DISTANCE_CAP;

  const reset = () => {
    setWhole("");
    setFractional("");
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
        // Trigger should be disabled at cap, but show the tooltip text as
        // an error if a race condition lets us reach here.
        setError(t("calculator:timesForPace.addCustomLimitReached"));
        break;
    }
  };

  const handleCancel = () => {
    setOpen(false);
    reset();
  };

  const handleUnitChange = (value: DistanceUnit) => {
    setUnit(value);
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-link btn-link-muted p-0 mt-2"
        disabled={atCap}
        onClick={() => setOpen(true)}
      >
        {savedDistances.length === 0
          ? t("calculator:timesForPace.addCustom")
          : t("calculator:timesForPace.addCustomWithCount", {
              count: savedDistances.length,
              cap: SAVED_DISTANCE_CAP,
            })}
      </button>
      {open && (
        <AddCustomDistanceSheet
          whole={whole}
          fractional={fractional}
          unit={unit}
          error={error}
          onWholeChange={setWhole}
          onFractionalChange={setFractional}
          onUnitChange={handleUnitChange}
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
            onChange={(e) => onUnitChange(e.target.value as DistanceUnit)}
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
        errorStyle="text"
        cancelLabel={t("calculator:timesForPace.form.cancel")}
        saveLabel={t("calculator:timesForPace.form.save")}
        onCancel={onClose}
        onSave={onSave}
      />
    </BottomSheet>
  );
}

export default TimesForPace;
