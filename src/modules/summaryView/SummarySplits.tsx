import { DistanceUnit } from "pace-calculator";
import { useTranslation } from "react-i18next";
import type { SplitsResult } from "@/utils/calculator";
import { formatTime, formatNaturalDuration } from "@/utils/formatTime";
import { formatSplitLabel } from "@/modules/summaryFormat";
import type { NextSplitsAction } from "@/hooks/useSplitsOverride";
import type { SplitsOverrideTarget } from "@/hooks/useSplitsOverride";
import { PencilIcon } from "./icons";
import { sectionTitleStyle, valueStyle } from "./styles";

// Splits grid + the "Show in X" override toggle + the optional track-summary
// caption underneath. CSS Grid with explicit row/column counts (rather than
// multi-column) so each row is strictly contained in its cell — no chance of
// leaking into the next column the way `column-count` does.
export function SummarySplits({
  splits,
  splitsColumnCount,
  splitsRowsPerColumn,
  splitsHeadingUnit,
  chromeVisible,
  nextAction,
  onOverride,
}: {
  splits: SplitsResult;
  splitsColumnCount: number;
  splitsRowsPerColumn: number;
  splitsHeadingUnit: string;
  chromeVisible: boolean;
  nextAction: NextSplitsAction;
  onOverride: (target: SplitsOverrideTarget) => void;
}) {
  const { t } = useTranslation("calculator");

  return (
    <>
      {/* Row reserves enough height for the toggle button up front, so
          showing/hiding the button doesn't reflow the splits grid. */}
      <div
        className="d-flex align-items-center mb-1 gap-3"
        style={{ minHeight: "1.75rem" }}
      >
        <div style={sectionTitleStyle}>
          {t("summary.splitsHeading", { unit: splitsHeadingUnit })}
        </div>
        {chromeVisible && nextAction !== null && (
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
            <PencilIcon size={14} />
          </button>
        )}
      </div>
      <div
        data-testid="summary-splits"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${splitsColumnCount}, max-content)`,
          gridTemplateRows: `repeat(${splitsRowsPerColumn}, auto)`,
          gridAutoFlow: "column",
          // Pack columns flush to the left with a fixed gap between them,
          // matching the Times-at-goal-pace section. Was `space-between`,
          // which stretched the columns across the full card width.
          justifyContent: "start",
          columnGap: "1.5rem",
          // Match the other sections at 1rem when the split list is manageable
          // (≤20 rows). Shrink only when the list gets long (marathon-scale)
          // so it still fits inside the card.
          fontSize: splits.rows.length > 20 ? "0.8rem" : "1rem",
          lineHeight: 1.3,
        }}
      >
        {splits.rows.map((split) => (
          <div
            key={split.splitNumber}
            data-testid="summary-split-row"
            className="d-flex"
            style={{ gap: "0.5rem" }}
          >
            <span className="text-muted">
              {formatSplitLabel(splits.unit, split.distance, split.splitNumber)}
            </span>
            <span style={valueStyle}>
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
        <div
          className="text-muted mt-1"
          style={{ fontSize: "0.75rem", lineHeight: 1.3 }}
          data-testid="summary-track-summary"
        >
          {splits.trackSummary.opening !== null &&
          splits.trackSummary.openingTime !== null
            ? t("result.trackSummary", {
                opening: splits.trackSummary.opening,
                openingTime: formatNaturalDuration(
                  splits.trackSummary.openingTime,
                  t("timeUnit.seconds"),
                ),
                lap: splits.trackSummary.lap,
                lapTime: formatNaturalDuration(
                  splits.trackSummary.lapTime,
                  t("timeUnit.seconds"),
                ),
              })
            : t("result.trackSummaryLapsOnly", {
                lap: splits.trackSummary.lap,
                lapTime: formatNaturalDuration(
                  splits.trackSummary.lapTime,
                  t("timeUnit.seconds"),
                ),
              })}
        </div>
      )}
    </>
  );
}
