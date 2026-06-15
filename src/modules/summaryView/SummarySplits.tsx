import { DistanceUnit } from "pace-calculator";
import { useTranslation } from "react-i18next";
import type { SplitsResult } from "@/utils/calculator";
import { formatTime } from "@/utils/formatTime";
import { formatSplitLabel } from "@/modules/summaryFormat";
import { TrackSummaryLine } from "@/modules/TrackSummaryLine";
import type { NextSplitsAction } from "@/hooks/useSplitsOverride";
import type { SplitsOverrideTarget } from "@/hooks/useSplitsOverride";
import PencilIcon from "@/assets/icons/pencil.svg?react";

export function SummarySplits({
  splits,
  splitsHeadingUnit,
  controlsVisible,
  nextAction,
  onOverride,
}: {
  splits: SplitsResult;
  splitsHeadingUnit: string;
  controlsVisible: boolean;
  nextAction: NextSplitsAction;
  onOverride: (target: SplitsOverrideTarget) => void;
}) {
  const { t } = useTranslation("calculator");

  return (
    <>
      {/* minHeight reserves space for the toggle so showing/hiding it doesn't reflow the grid. */}
      <div
        className="d-flex align-items-center mb-1 gap-3"
        style={{ minHeight: "1.75rem" }}
      >
        <div className="summary-section-title">
          {t("summary.splitsHeading", { unit: splitsHeadingUnit })}
        </div>
        {controlsVisible && nextAction !== null && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOverride(nextAction.setTo);
            }}
            className="btn btn-link btn-sm p-0 text-muted text-smallish d-inline-flex align-items-center gap-1"
            data-testid="summary-splits-override-toggle"
          >
            <span>{t("result.splitsInUnit", { unit: nextAction.label })}</span>
            <PencilIcon width={14} height={14} />
          </button>
        )}
      </div>
      <div
        className="summary-splits-list"
        data-testid="summary-splits"
        style={{
          // Stay single-column for sparse goals; only break out once it pays off.
          columnCount: splits.rows.length > 5 ? 3 : 1,
          // Shrink only at marathon-scale row counts.
          fontSize: splits.rows.length > 20 ? "0.8rem" : "0.9rem",
        }}
      >
        {splits.rows.map((split) => (
          <div
            key={split.splitNumber}
            data-testid="summary-split-row"
            className="summary-splits-row"
          >
            <span className="text-muted">
              {formatSplitLabel(splits.unit, split.distance, split.splitNumber)}
            </span>
            <span className="summary-section-value">
              {formatTime({
                time: split.time,
                alwaysShowHours: splits.unit !== DistanceUnit.Meters,
                showHundredths: splits.showHundredths,
              })}
            </span>
          </div>
        ))}
      </div>
      {splits.trackSummary && (
        <TrackSummaryLine
          trackSummary={splits.trackSummary}
          className="text-muted mt-1 summary-track-summary-line"
          data-testid="summary-track-summary"
        />
      )}
    </>
  );
}
