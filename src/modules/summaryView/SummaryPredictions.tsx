import { useTranslation } from "react-i18next";
import { type SummaryPredictionRow } from "@/modules/summaryView/summaryData";

export function SummaryPredictions({ rows }: { rows: SummaryPredictionRow[] }) {
  const { t } = useTranslation(["calculator", "events"]);

  return (
    <>
      <div
        className="mb-1 summary-section-title"
        data-testid="summary-predictions-heading"
      >
        {t("calculator:summary.predictionsHeading")}
      </div>
      <div className="summary-list" data-testid="summary-predictions">
        {rows.map((row) => (
          <div
            key={row.id}
            data-testid="summary-prediction-row"
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
