import { useTranslation } from "react-i18next";
import {
  formatFriendlyTimeExact,
  type SummaryPredictionRow,
} from "@/modules/summaryRows";

// "Half Marathon" is too wide for this column; the adjacent time disambiguates "1/2 Mar".
const SHORT_EVENT_LABELS: Record<string, string> = {
  halfMarathon: "1/2 Mar",
};

export function SummaryPredictions({
  rows,
  showHundredths,
}: {
  rows: SummaryPredictionRow[];
  showHundredths: boolean;
}) {
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
              {SHORT_EVENT_LABELS[row.id] ?? t(`events:event.${row.id}.label`)}
            </span>
            <span className="summary-section-value">
              {formatFriendlyTimeExact(row.time, showHundredths)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
