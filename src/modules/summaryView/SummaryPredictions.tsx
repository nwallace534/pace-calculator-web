import { useTranslation } from "react-i18next";
import {
  formatFriendlyTimeExact,
  type SummaryPredictionRow,
} from "@/modules/summaryRows";
import { sectionTitleStyle, valueStyle } from "./styles";

// Short forms for the prediction column. Catalog labels are correct globally
// (event picker etc.), but "Half Marathon" makes this column too wide. The
// shortened "1/2 Mar" reads fine in context with the time beside it.
const SHORT_EVENT_LABELS: Record<string, string> = {
  halfMarathon: "1/2 Mar",
};

// Multi-column list of "5K | 41m 41s" rows for predicted race times. Hidden
// entirely when the parent passes no rows (the middle-range tier).
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
        className="mb-1"
        style={sectionTitleStyle}
        data-testid="summary-predictions-heading"
      >
        {t("calculator:summary.predictionsHeading")}
      </div>
      <div
        data-testid="summary-predictions"
        style={{
          columnWidth: "8rem",
          columnGap: "0.25rem",
        }}
      >
        {rows.map((row) => (
          <div
            key={row.id}
            data-testid="summary-prediction-row"
            className="d-flex"
            style={{
              gap: "0.4rem",
              breakInside: "avoid",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ minWidth: "4em" }}>
              {SHORT_EVENT_LABELS[row.id] ?? t(`events:event.${row.id}.label`)}
            </span>
            <span style={valueStyle}>
              {formatFriendlyTimeExact(row.time, showHundredths)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
