import { useTranslation } from "react-i18next";
import useCalculatorStore from "@/state/useCalculatorStore";
import CardIcon from "@/assets/icons/card.svg?react";

function SummaryCardButton() {
  const { t } = useTranslation("calculator");
  const openSummaryView = useCalculatorStore((s) => s.openSummaryView);

  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
      style={{
        color: "var(--bs-emphasis-color)",
        borderWidth: "2px",
        borderColor: "var(--bs-emphasis-color)",
      }}
      onClick={openSummaryView}
    >
      <span>{t("result.summary.openButton")}</span>
      <CardIcon />
    </button>
  );
}

export default SummaryCardButton;
