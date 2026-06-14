import { useTranslation } from "react-i18next";
import useCalculatorStore from "@/state/useCalculatorStore";

function CardIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

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
