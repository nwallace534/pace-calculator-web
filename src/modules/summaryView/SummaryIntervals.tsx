import { useTranslation } from "react-i18next";
import {
  formatFriendlyTimeExact,
  type IntervalRow,
} from "@/modules/summaryRows";
import { sectionTitleStyle, valueStyle } from "./styles";

// "Times at goal pace" — every reference distance shorter than the goal,
// rendered with the same multi-column packing pattern as predictions.
export function SummaryIntervals({
  rows,
  showHundredths,
}: {
  rows: IntervalRow[];
  showHundredths: boolean;
}) {
  const { t } = useTranslation("calculator");

  return (
    <>
      <div className="mb-1" style={sectionTitleStyle}>
        {t("summary.intervalsHeading")}
      </div>
      <div
        data-testid="summary-intervals"
        style={{
          // Multi-column for responsive packing. No maxWidth — the card
          // already caps width at phone-portrait, so the inner sections are
          // free to use whatever room that leaves.
          columnWidth: "8rem",
          columnGap: "0.25rem",
        }}
      >
        {rows.map((row) => (
          <div
            key={row.label}
            data-testid="summary-interval-row"
            className="d-flex"
            style={{
              gap: "0.4rem",
              breakInside: "avoid",
              whiteSpace: "nowrap",
            }}
          >
            {/* Fixed label box so times line up at the same x position across
                every row in a column. Sized to fit "3000m" / "1/2 Mar" — the
                widest labels after the shortening. */}
            <span style={{ minWidth: "4em" }}>{row.label}</span>
            <span style={valueStyle}>
              {formatFriendlyTimeExact(row.time, showHundredths)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
