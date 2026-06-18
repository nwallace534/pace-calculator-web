import { DistanceUnit } from "pace-calculator";
import { useTranslation } from "react-i18next";
import type { SplitsResult } from "@/utils/calculator";
import { formatTime } from "@/utils/formatTime";
import { formatSplitLabel } from "@/modules/summaryFormat";
import { TrackSummaryLine } from "@/modules/TrackSummaryLine";
import { SplitsViewPicker } from "@/components/SplitsViewPicker";
import type { SplitsOverrideOption } from "@/utils/splitsOverride";
import type { SplitsViewOption } from "@/hooks/useSplitsOverride";
import PencilIcon from "@/assets/icons/pencil.svg?react";

export function SummarySplits({
  splits,
  controlsVisible,
  selected,
  pickerOptions,
  onSelect,
}: {
  splits: SplitsResult;
  controlsVisible: boolean;
  selected: SplitsOverrideOption;
  pickerOptions: SplitsViewOption[];
  onSelect: (option: SplitsOverrideOption) => void;
}) {
  const { t } = useTranslation("calculator");

  const enabledOptionCount = pickerOptions.filter((o) => o.enabled).length;
  const showModify = controlsVisible && enabledOptionCount > 1;

  return (
    <>
      {/* minHeight reserves space so the modify link showing/hiding doesn't reflow. */}
      <div
        className="d-flex align-items-center mb-1 gap-3"
        style={{ minHeight: "1.75rem" }}
      >
        <div
          className="summary-section-title"
          data-testid="summary-splits-heading"
        >
          {t(selected.i18nKey)}
        </div>
        {showModify && (
          <SplitsViewPicker
            selected={selected}
            options={pickerOptions}
            onSelect={onSelect}
            placement="bottom-start"
          >
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-muted text-smallish d-inline-flex align-items-center gap-1"
              data-testid="splits-view-picker-toggle"
            >
              <span>{t("summary.modifySplits")}</span>
              <PencilIcon width={14} height={14} />
            </button>
          </SplitsViewPicker>
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
