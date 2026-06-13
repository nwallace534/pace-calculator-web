import { useTranslation } from "react-i18next";
import useCalculatorStore from "@/state/useCalculatorStore";

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

// Tapping Share opens the goal-summary card directly. The card is the
// shareable artifact, and it now carries its own Copy link control + URL
// preview in the chrome — so the user lands on the thing they're sharing
// without an interstitial dropdown.
function ShareTargetButton() {
  const { t } = useTranslation("calculator");
  const openSummaryView = useCalculatorStore((s) => s.openSummaryView);

  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center justify-content-center"
      style={{
        color: "var(--bs-emphasis-color)",
        borderWidth: "2px",
        borderColor: "var(--bs-emphasis-color)",
      }}
      aria-label={t("share.button")}
      onClick={openSummaryView}
    >
      <ShareIcon />
    </button>
  );
}

export default ShareTargetButton;
