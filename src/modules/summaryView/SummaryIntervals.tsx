import { useTranslation } from "react-i18next";
import { type IntervalRow } from "@/modules/summaryRows";

export function SummaryIntervals({ rows }: { rows: IntervalRow[] }) {
  const { t } = useTranslation("calculator");

  return (
    <>
      <div className="mb-1 summary-section-title">
        {t("summary.intervalsHeading")}
      </div>
      <div className="summary-list" data-testid="summary-intervals">
        {rows.map((row) => (
          <div
            key={row.label}
            data-testid="summary-interval-row"
            className="summary-list-row"
          >
            {/* Fixed label box so times align; sized for the widest label ("3000m" / "1/2 Mar"). */}
            <span className="summary-list-label">{row.label}</span>
            <span className="summary-section-value">{row.timeText}</span>
          </div>
        ))}
      </div>
    </>
  );
}
