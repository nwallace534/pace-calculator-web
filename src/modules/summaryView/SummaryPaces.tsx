import { MultiPace } from "pace-calculator";
import { useTranslation } from "react-i18next";
import { formatTime } from "@/utils/formatTime";
import { valueStyle } from "./styles";

// Baseline-aligned so monospace values and regular text labels line up across columns.
export function SummaryPaces({ paceResults }: { paceResults: MultiPace }) {
  const { t } = useTranslation("calculator");

  return (
    <div className="d-flex align-items-baseline" style={{ fontSize: "0.9rem" }}>
      <div className="flex-grow-1">
        <div>{t("result.pacePerKm")}</div>
        <output style={valueStyle}>
          {formatTime({ time: paceResults.perKilometer })} {t("unit.perKm")}
        </output>
      </div>
      <div className="flex-grow-1 ms-3">
        <div>{t("result.pacePerMile")}</div>
        <output style={valueStyle}>
          {formatTime({ time: paceResults.perMile })} {t("unit.perMile")}
        </output>
      </div>
      {/* Vertical divider — inset so it doesn't span the full section height. */}
      <div
        aria-hidden="true"
        className="ms-2"
        style={{
          alignSelf: "stretch",
          width: "1px",
          backgroundColor: "currentColor",
          opacity: 0.25,
          marginTop: "0.3rem",
          marginBottom: "0.3rem",
        }}
      />
      <div className="ps-2 d-flex flex-column">
        <output style={valueStyle}>
          {paceResults.speedKph.toFixed(1)} {t("unit.kph")}
        </output>
        <output style={valueStyle}>
          {paceResults.speedMph.toFixed(1)} {t("unit.mph")}
        </output>
      </div>
    </div>
  );
}
