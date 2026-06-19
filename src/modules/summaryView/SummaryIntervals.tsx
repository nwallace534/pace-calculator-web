import { useTranslation } from "react-i18next";
import { type IntervalRow } from "@/modules/summaryView/summaryData";

export function SummaryIntervals({ rows }: { rows: IntervalRow[] }) {
  const { t } = useTranslation(["calculator", "events"]);

  return (
    <>
      <div className="mb-1 summary-section-title">
        {t("summary.intervalsHeading")}
      </div>
      <div className="summary-list" data-testid="summary-intervals">
        {rows.map((row) => (
          <div
            key={row.id}
            data-testid="summary-interval-row"
            className="summary-list-row"
          >
            <span className="summary-list-label">
              {t(`events:event.${row.id}.shortLabel`, {
                defaultValue: t(`events:event.${row.id}.label`),
              })}
            </span>
            <span className="summary-section-value">{row.timeText}</span>
          </div>
        ))}
      </div>
    </>
  );
}
