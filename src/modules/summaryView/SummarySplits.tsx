import { DistanceUnit } from "pace-calculator";
import { useTranslation } from "react-i18next";
import type { SplitsResult } from "@/utils/calculator";
import { formatTime } from "@/utils/formatTime";
import { formatSplitLabel } from "@/modules/summaryFormat";
import { TrackSummaryLine } from "@/modules/TrackSummaryLine";
import type { NextSplitsAction } from "@/hooks/useSplitsOverride";
import type { SplitsOverrideTarget } from "@/hooks/useSplitsOverride";
import { PencilIcon } from "./icons";
import { sectionTitleStyle, valueStyle } from "./styles";

// Grid (not multi-column) because multi-column was leaking rows between columns.
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
      {/* minHeight reserves space for the toggle so showing/hiding it doesn't reflow the grid. */}
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
          // Left-packed; `space-between` was stretching columns across the card.
          justifyContent: "start",
          columnGap: "1.5rem",
          // Shrink only at marathon-scale row counts.
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
        <TrackSummaryLine
          trackSummary={splits.trackSummary}
          className="text-muted mt-1"
          style={{ fontSize: "0.75rem", lineHeight: 1.3 }}
          data-testid="summary-track-summary"
        />
      )}
    </>
  );
}
