import useCalculatorStore from "@/state/useCalculatorStore";
import { formatTime } from "@/utils/formatTime";
import { useTranslation } from "react-i18next";
import { Time } from "pace-calculator";
import AddCustomDistance from "@/modules/AddCustomDistance";
import {
  buildTimesForPaceRows,
  TimesForPaceRow,
} from "@/modules/timesForPaceRows";

const getRowTimeDisplay = ({
  row,
  showingPredictions,
  unsupportedPrediction,
}: {
  row: TimesForPaceRow;
  showingPredictions: boolean;
  unsupportedPrediction: string;
}): string => {
  if (!showingPredictions) {
    return formatTime({ time: row.time, alwaysShowHours: true });
  }

  if (!row.prediction) return unsupportedPrediction;

  return formatTime({
    time: row.prediction,
    alwaysShowHours: true,
  });
};

function TimesForPace({ results }: { results: Record<string, Time> | null }) {
  const { t } = useTranslation(["events", "calculator"]);
  const activeTab = useCalculatorStore((state) => state.timesForPaceTab);
  const setActiveTab = useCalculatorStore((state) => state.setTimesForPaceTab);
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

  const rows = buildTimesForPaceRows({
    results,
    event,
    distanceWhole,
    distanceFractional,
    distanceUnit,
    timeHours,
    timeMinutes,
    timeSeconds,
    timeHundredths,
    savedDistances,
    getEventLabel: (id) => t(`event.${id}.label`),
  });

  const showingPredictions = activeTab === "predictions";

  return (
    <div>
      <div
        className="btn-group times-for-pace-tabs w-100 mt-2"
        role="tablist"
        aria-label={t("calculator:timesForPace.tabs.label")}
      >
        <button
          type="button"
          role="tab"
          aria-selected={!showingPredictions}
          className={`btn btn-sm ${
            !showingPredictions ? "btn-accent" : "btn-outline-secondary"
          }`}
          onClick={() => setActiveTab("times")}
        >
          {t("calculator:timesForPace.tabs.times")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={showingPredictions}
          className={`btn btn-sm ${
            showingPredictions ? "btn-accent" : "btn-outline-secondary"
          }`}
          onClick={() => setActiveTab("predictions")}
        >
          {t("calculator:timesForPace.tabs.predictions")}
        </button>
      </div>
      <table className="align-middle mt-2 w-100">
        <thead>
          <tr>
            <th className="w-50">{t("calculator:result.columnDistance")}</th>
            <th className="w-50">
              {showingPredictions
                ? t("calculator:timesForPace.columnPrediction")
                : t("calculator:result.columnTime")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.highlight ? "fw-bold" : undefined}>
              <td>
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
                {getRowTimeDisplay({
                  row,
                  showingPredictions,
                  unsupportedPrediction: t(
                    "calculator:timesForPace.unsupportedPrediction",
                  ),
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="times-for-pace-footer">
        {showingPredictions ? (
          <p className="text-smallish text-body-secondary mb-0 mt-2">
            {t("calculator:timesForPace.predictionNote")}
          </p>
        ) : (
          <AddCustomDistance />
        )}
      </div>
    </div>
  );
}

export default TimesForPace;
