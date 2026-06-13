import useCalculatorStore from "@/state/useCalculatorStore";
import { DistanceUnitOptions, DistanceUnitShortLabel } from "@/utils/distances";
import { SplitsResult } from "@/utils/calculator";
import { formatTime, formatNaturalDuration } from "@/utils/formatTime";
import { useTranslation } from "react-i18next";
import { DistanceUnit } from "pace-calculator";

function PaceSplits({ splits }: { splits: SplitsResult | null }) {
  const { t } = useTranslation("calculator");
  const toggleSplitsUnit = useCalculatorStore(
    (state) => state.toggleSplitsUnit,
  );

  if (!splits) return null;

  const isMeters = splits.unit === DistanceUnit.Meters;

  const nextUnit =
    splits.unit === DistanceUnit.Kilometers
      ? DistanceUnit.Miles
      : DistanceUnit.Kilometers;
  const nextUnitLabel = DistanceUnitOptions.find(
    (option) => option.value === nextUnit,
  )?.label;

  const distanceUnitLabel = DistanceUnitShortLabel[splits.unit];

  // Whole splits render bare; the tail split (e.g. 10K in miles → 6.21) keeps
  // two decimals so it doesn't collide with the prior row.
  const formatSplitDistance = (d: number) =>
    Number.isInteger(d) ? `${d}` : d.toFixed(2);

  const secondsLabel = t("timeUnit.seconds");

  return (
    <>
      {!isMeters && (
        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-muted text-smallish"
            onClick={toggleSplitsUnit}
          >
            {t("result.splitsInUnit", { unit: nextUnitLabel })}
          </button>
        </div>
      )}
      <table className="align-middle w-100">
        <thead>
          <tr>
            <th className="w-50">{t("result.columnDistance")}</th>
            <th className="w-50">{t("result.columnTime")}</th>
          </tr>
        </thead>
        <tbody>
          {splits.rows.map((split) => (
            <tr key={split.splitNumber}>
              <td>{`${formatSplitDistance(split.distance)}${distanceUnitLabel}`}</td>
              <td className="output fs-6">
                {formatTime({
                  time: split.time,
                  alwaysShowHours: !isMeters,
                  showHundredths: splits.showHundredths,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {splits.trackSummary && (
        <div className="text-muted text-smallish mt-2">
          {splits.trackSummary.opening !== null &&
          splits.trackSummary.openingTime !== null
            ? t("result.trackSummary", {
                opening: splits.trackSummary.opening,
                openingTime: formatNaturalDuration(
                  splits.trackSummary.openingTime,
                  secondsLabel,
                ),
                lap: splits.trackSummary.lap,
                lapTime: formatNaturalDuration(
                  splits.trackSummary.lapTime,
                  secondsLabel,
                ),
              })
            : t("result.trackSummaryLapsOnly", {
                lap: splits.trackSummary.lap,
                lapTime: formatNaturalDuration(
                  splits.trackSummary.lapTime,
                  secondsLabel,
                ),
              })}
        </div>
      )}
    </>
  );
}

export default PaceSplits;
