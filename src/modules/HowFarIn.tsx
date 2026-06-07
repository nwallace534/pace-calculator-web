import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  calculateDistance,
  DistanceInAllUnits,
  DistanceUnit,
  getDistanceInAllUnits,
  MultiPace,
  Time,
} from "pace-calculator";
import { ExpandableCard } from "@/components/ExpandableCard";
import TimeControl from "@/components/TimeControl";
import BottomSheet from "@/components/BottomSheet";
import SheetActions from "@/components/SheetActions";
import useCalculatorStore from "@/state/useCalculatorStore";
import {
  BUILT_IN_DURATION_PRESETS,
  SAVED_DURATION_CAP,
} from "@/state/savedDurationsSlice";
import { DistanceUnitOptions, formatDistanceValue } from "@/utils/distances";
import { formatTime } from "@/utils/formatTime";
import { applyTimeStep, timeStringsToMs } from "@/utils/time";
import { getValidatedInput } from "@/utils/input";

const MAX_TIME_MS = 99 * 3600000 + 59 * 60000 + 59 * 1000;
const STEP_MS = 1000;

type HowFarInTime = {
  timeHours: string;
  timeMinutes: string;
  timeSeconds: string;
  timeHundredths: string;
};

type DurationRow = {
  id: string;
  label: string;
  time: Time;
  isCustom: boolean;
};

const defaultSheetDuration: HowFarInTime = {
  timeHours: "00",
  timeMinutes: "00",
  timeSeconds: "00",
  timeHundredths: "00",
};

const getDefaultOutputUnit = (distanceUnit: DistanceUnit): DistanceUnit =>
  distanceUnit === DistanceUnit.Miles
    ? DistanceUnit.Miles
    : DistanceUnit.Kilometers;

const secondsToTime = (seconds: number): Time => ({
  hours: Math.floor(seconds / 3600),
  minutes: Math.floor((seconds / 60) % 60),
  seconds: seconds % 60,
  milliseconds: 0,
});

const formatDurationLabel = (time: Time): string => {
  // 1. Determine which units are active
  const hasHours = time.hours > 0;
  const hasMinutes = time.minutes > 0;
  const hasSeconds = time.seconds > 0 || time.milliseconds > 0;

  // Count how many distinct units we have
  const activeUnitsCount = [hasHours, hasMinutes, hasSeconds].filter(
    Boolean,
  ).length;

  // Fallback for zero duration
  if (activeUnitsCount === 0) {
    return "0 seconds";
  }

  // TODO: need to add these strings to translations

  const parts: string[] = [];

  // 2. Case A: Only ONE unit is active -> Use long-form words
  if (activeUnitsCount === 1) {
    if (hasHours) {
      return `${time.hours} ${time.hours === 1 ? "hour" : "hours"}`;
    }
    if (hasMinutes) {
      return `${time.minutes} ${time.minutes === 1 ? "minute" : "minutes"}`;
    }
    if (hasSeconds) {
      return `${time.seconds} ${time.seconds === 1 ? "second" : "seconds"}`;
    }
  }

  // 3. Case B: MULTIPLE units are active -> Use compressed format (h, m, s)
  if (hasHours) {
    parts.push(`${time.hours}h`);
  }
  if (hasMinutes) {
    parts.push(`${time.minutes}m`);
  }
  if (hasSeconds) {
    parts.push(`${time.seconds}s`);
  }

  return parts.join(" ");
};

function HowFarIn({ paceResults }: { paceResults: MultiPace }) {
  const { t } = useTranslation("calculator");
  const distanceUnit = useCalculatorStore((state) => state.distanceUnit);
  const savedDurations = useCalculatorStore((state) => state.savedDurations);
  const addSavedDuration = useCalculatorStore(
    (state) => state.addSavedDuration,
  );
  const removeSavedDuration = useCalculatorStore(
    (state) => state.removeSavedDuration,
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAlternateUnit, setShowAlternateUnit] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDuration, setSheetDuration] =
    useState<HowFarInTime>(defaultSheetDuration);
  const [error, setError] = useState<string | null>(null);
  const atCustomCap = savedDurations.length >= SAVED_DURATION_CAP;

  const defaultOutputUnit = getDefaultOutputUnit(distanceUnit);
  const isKmDefault = defaultOutputUnit === DistanceUnit.Kilometers;

  const outputUnit = showAlternateUnit
    ? isKmDefault
      ? DistanceUnit.Miles
      : DistanceUnit.Kilometers
    : defaultOutputUnit;

  const nextUnit =
    outputUnit === DistanceUnit.Kilometers
      ? DistanceUnit.Miles
      : DistanceUnit.Kilometers;

  const isKilometer = outputUnit === DistanceUnit.Kilometers;
  const paceTime = isKilometer ? paceResults.perKilometer : paceResults.perMile;
  const unitKey = isKilometer ? "unit.perKm" : "unit.perMile";

  const currentPace = `${formatTime({ time: paceTime })} ${t(unitKey)}`;

  const nextUnitLabel = DistanceUnitOptions.find(
    (option) => option.value === nextUnit,
  )?.label;

  const rows = useMemo<DurationRow[]>(
    () => [
      ...BUILT_IN_DURATION_PRESETS.map((preset) => ({
        id: preset.id,
        time: secondsToTime(preset.seconds),
        isCustom: false,
        label: t(`howFarIn.durationPreset.${preset.id}`),
      })),
      ...savedDurations.map((duration) => {
        const time = secondsToTime(duration.seconds);
        return {
          id: duration.id,
          label: formatDurationLabel(time),
          time,
          isCustom: true,
        };
      }),
    ],
    [savedDurations, t],
  );

  const getDistanceForTime = (time: Time): DistanceInAllUnits =>
    getDistanceInAllUnits(
      calculateDistance({
        pace: {
          hours: paceResults.perKilometer.hours,
          minutes: paceResults.perKilometer.minutes,
          seconds: paceResults.perKilometer.seconds,
          milliseconds: paceResults.perKilometer.milliseconds,
          unit: DistanceUnit.Kilometers,
        },
        time,
      }),
    );

  const resetSheet = () => {
    setSheetDuration(defaultSheetDuration);
    setError(null);
  };

  const handleSave = () => {
    const durationMs = timeStringsToMs(sheetDuration);
    if (durationMs <= 0) {
      setError(t("howFarIn.form.errorEmpty"));
      return;
    }

    const result = addSavedDuration({
      seconds: Math.floor(durationMs / 1000),
    });

    if (result.ok) {
      setSheetOpen(false);
      resetSheet();
      return;
    }

    switch (result.reason) {
      case "invalid":
        setError(t("howFarIn.form.errorEmpty"));
        break;
      case "duplicate-builtin":
      case "duplicate-saved":
        setError(t("howFarIn.form.errorDuplicate"));
        break;
      case "limit":
        setError(t("howFarIn.addCustomLimitReached"));
        break;
    }
  };

  const handleClose = () => {
    setSheetOpen(false);
    resetSheet();
  };

  const removeCustomRow = (id: string) => {
    removeSavedDuration(id);
  };

  return (
    <ExpandableCard
      title={t("result.howFarIn")}
      testId="card-how-far-in"
      isExpanded={isExpanded}
      handleToggle={setIsExpanded}
    >
      <div className="d-flex justify-content-between align-items-baseline gap-2 mb-2 text-muted text-smallish">
        <span>{t("howFarIn.currentPace", { pace: currentPace })}</span>
        <button
          type="button"
          className="btn btn-link btn-sm p-0 text-muted text-smallish"
          onClick={() => setShowAlternateUnit((current) => !current)}
        >
          {t("howFarIn.showInUnit", { unit: nextUnitLabel })}
        </button>
      </div>

      <table className="w-100">
        <colgroup>
          <col style={{ width: "65%" }} />
          <col style={{ width: "35%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>{t("howFarIn.columnDuration")}</th>
            <th>{t("howFarIn.columnDistance")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <DurationResultRow
              key={row.id}
              row={row}
              distance={getDistanceForTime(row.time)}
              outputUnit={outputUnit}
              onRemove={removeCustomRow}
            />
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-between align-items-baseline gap-2 mt-2">
        <button
          type="button"
          className="btn btn-link btn-link-muted p-0"
          disabled={atCustomCap}
          onClick={() => setSheetOpen(true)}
        >
          {t("howFarIn.addCustom")}
        </button>
        {atCustomCap && (
          <span className="text-muted text-smallish">
            {t("howFarIn.addCustomLimitReached")}
          </span>
        )}
      </div>

      {sheetOpen && (
        <AddCustomDurationSheet
          duration={sheetDuration}
          error={error}
          onDurationChange={(duration) => {
            setSheetDuration(duration);
            setError(null);
          }}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </ExpandableCard>
  );
}

function DurationResultRow({
  row,
  distance,
  outputUnit,
  onRemove,
}: {
  row: DurationRow;
  distance: DistanceInAllUnits;
  outputUnit: DistanceUnit;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation("calculator");
  const miles = distance.inMiles.distanceValue;
  const formattedDistance =
    outputUnit === DistanceUnit.Kilometers
      ? `${formatDistanceValue(distance.inKilometers.distanceValue)}${t(
          "unit.kilometersShortRunning",
        )}`
      : `${formatDistanceValue(miles)} ${
          miles === 1 ? t("unit.mileSingular") : t("unit.milesShort")
        }`;

  return (
    <tr>
      <td>
        {row.label}
        {row.isCustom && (
          <button
            type="button"
            className="badge rounded-pill text-bg-secondary ms-2 border-0"
            aria-label={t("howFarIn.removeAriaLabel")}
            onClick={() => onRemove(row.id)}
          >
            {t("howFarIn.customBadge")}
            <span aria-hidden="true" className="ms-1">
              ×
            </span>
          </button>
        )}
      </td>
      <td className="output fs-6 align-top">{formattedDistance}</td>
    </tr>
  );
}

interface SheetProps {
  duration: HowFarInTime;
  error: string | null;
  onDurationChange: (duration: HowFarInTime) => void;
  onSave: () => void;
  onClose: () => void;
}

function AddCustomDurationSheet({
  duration,
  error,
  onDurationChange,
  onSave,
  onClose,
}: SheetProps) {
  const { t } = useTranslation("calculator");
  const currentMs = timeStringsToMs(duration);
  const atMin = currentMs <= 0;
  const atMax = currentMs >= MAX_TIME_MS;

  const setDurationField = (
    field: "timeHours" | "timeMinutes" | "timeSeconds",
    value: string,
  ) => {
    const maxNumber = field === "timeHours" ? 99 : 59;
    onDurationChange({
      ...duration,
      [field]: getValidatedInput(value, maxNumber, 2),
    });
  };

  const incrementDuration = (steps: number) => {
    onDurationChange(
      applyTimeStep({
        currentTime: duration,
        steps,
        stepMs: STEP_MS,
        maxMs: MAX_TIME_MS,
      }),
    );
  };

  return (
    <BottomSheet
      title={t("howFarIn.addCustomTitle")}
      closeAriaLabel={t("howFarIn.closeAriaLabel")}
      onClose={onClose}
      maxWidth="520px"
      sheetStyle={{ height: "auto", maxHeight: "90vh" }}
      bodyStyle={{ overflowY: "visible", flex: "0 0 auto" }}
      lockPageScroll
    >
      <TimeControl
        ids={{
          hours: "howFarHours",
          minutes: "howFarMinutes",
          seconds: "howFarSeconds",
          hundredths: "howFarHundredths",
        }}
        values={{
          hours: duration.timeHours,
          minutes: duration.timeMinutes,
          seconds: duration.timeSeconds,
          hundredths: duration.timeHundredths,
        }}
        showHours
        showMinutes
        showHundredths={false}
        onHoursChange={(value) => setDurationField("timeHours", value)}
        onMinutesChange={(value) => setDurationField("timeMinutes", value)}
        onSecondsChange={(value) => setDurationField("timeSeconds", value)}
        onHundredthsChange={(value) =>
          onDurationChange({ ...duration, timeHundredths: value })
        }
        onStep={incrementDuration}
        hintLabel={t("holdHint")}
        decreaseAriaLabel={t("howFarIn.decreaseDurationAriaLabel")}
        increaseAriaLabel={t("howFarIn.increaseDurationAriaLabel")}
        atMin={atMin}
        atMax={atMax}
      />

      <SheetActions
        error={error}
        cancelLabel={t("howFarIn.form.cancel")}
        saveLabel={t("howFarIn.form.save")}
        onCancel={onClose}
        onSave={onSave}
      />
    </BottomSheet>
  );
}

export default HowFarIn;
