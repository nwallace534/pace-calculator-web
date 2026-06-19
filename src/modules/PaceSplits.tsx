import { DistanceUnitShortLabel } from "@/utils/distances";
import { formatTime } from "@/utils/formatTime";
import { useTranslation } from "react-i18next";
import { DistanceUnit } from "pace-calculator";
import { TrackSummaryLine } from "@/modules/TrackSummaryLine";
import { SplitsViewPicker } from "@/components/SplitsViewPicker";
import { useSplitsViewSelection } from "@/hooks/useSplitsViewSelection";

function PaceSplits() {
  const { t } = useTranslation("calculator");
  const splitsControl = useSplitsViewSelection();
  const splits = splitsControl.splits;

  if (!splits) return null;

  const isMeters = splits.unit === DistanceUnit.Meters;
  const distanceUnitLabel = DistanceUnitShortLabel[splits.unit];

  // Whole splits render bare; the tail split (e.g. 10K in miles → 6.21) keeps
  // two decimals so it doesn't collide with the prior row.
  const formatSplitDistance = (d: number) =>
    Number.isInteger(d) ? `${d}` : d.toFixed(2);

  return (
    <>
      <div className="d-flex justify-content-end">
        <SplitsViewPicker
          selected={splitsControl.selected}
          options={splitsControl.options}
          onSelect={splitsControl.onSelect}
        />
      </div>
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
        <TrackSummaryLine
          trackSummary={splits.trackSummary}
          className="text-muted text-smallish mt-2"
        />
      )}
    </>
  );
}

export default PaceSplits;
