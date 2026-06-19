import { MultiPace } from "pace-calculator";
import { useTranslation } from "react-i18next";
import { formatTime } from "@/utils/formatTime";

// Baseline-aligned so monospace values and regular text labels line up across columns.
export function SummaryPaces({ paceResults }: { paceResults: MultiPace }) {
  const { t } = useTranslation("calculator");

  return (
    <div className="d-flex align-items-baseline">
      <div className="flex-grow-1">
        <div>{t("result.pacePerKm")}</div>
        <output className="summary-section-value">
          {formatTime({ time: paceResults.perKilometer })} {t("unit.perKm")}
        </output>
      </div>
      <div className="flex-grow-1 ms-3">
        <div>{t("result.pacePerMile")}</div>
        <output className="summary-section-value">
          {formatTime({ time: paceResults.perMile })} {t("unit.perMile")}
        </output>
      </div>
      <div aria-hidden="true" className="ms-2 summary-vertical-divider" />
      <div className="ps-2 d-flex flex-column">
        <output className="summary-section-value">
          {paceResults.speedKph.toFixed(1)} {t("unit.kph")}
        </output>
        <output className="summary-section-value">
          {paceResults.speedMph.toFixed(1)} {t("unit.mph")}
        </output>
      </div>
    </div>
  );
}
