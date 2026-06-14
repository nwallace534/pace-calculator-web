import { useTranslation } from "react-i18next";
import {
  formatFriendlyTimeExact,
  type IntervalRow,
} from "@/modules/summaryRows";
import { sectionTitleStyle, valueStyle } from "./styles";

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
            {/* Fixed label box so times align; sized for the widest label ("3000m" / "1/2 Mar"). */}
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
