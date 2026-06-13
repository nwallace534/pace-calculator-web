import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { CloseButton, CopyIcon } from "./icons";

// Auto-hiding controls + screenshot-mode label + the optional "from share"
// orientation hint. All four share a single fadeStyle so they appear/disappear
// in lockstep — the parent owns the visibility state via useAutoHideChrome.
export function SummaryChrome({
  fadeStyle,
  arrivedFromShare,
  onCopy,
  onClose,
}: {
  fadeStyle: CSSProperties;
  arrivedFromShare: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("calculator");

  return (
    <>
      {/* Header controls — absolutely positioned so they fade in/out without
          shifting the card. */}
      <div
        data-testid="summary-controls-left"
        style={{
          position: "absolute",
          top: "0.75rem",
          left: "0.75rem",
          zIndex: 10,
          ...fadeStyle,
        }}
      >
        <button
          type="button"
          onClick={onCopy}
          data-testid="summary-copy-link"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
          style={{
            color: "var(--summary-chrome-color)",
            borderColor: "var(--summary-chrome-color)",
          }}
        >
          <CopyIcon />
          <span>{t("summary.copyLink")}</span>
        </button>
      </div>

      <div
        data-testid="summary-controls-right"
        style={{
          position: "absolute",
          top: "0.75rem",
          right: "0.75rem",
          zIndex: 10,
          ...fadeStyle,
        }}
      >
        <CloseButton onClick={onClose} ariaLabel={t("summary.close")} />
      </div>

      {/* "Screenshot mode" label — uses the same chrome colour as the
          surrounding buttons so all three controls share a contrast tone,
          without going as dark as pure emphasis. */}
      <div
        data-testid="summary-screenshot-mode-toast"
        className="text-smallish"
        style={{
          position: "absolute",
          top: "0.95rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          color: "var(--summary-chrome-color)",
          ...fadeStyle,
        }}
      >
        {t("summary.screenshotModeToast")}
      </div>

      {arrivedFromShare && (
        <div
          className="mx-auto mb-2 text-center text-muted text-smallish"
          style={{ maxWidth: "28rem", ...fadeStyle }}
          data-testid="summary-from-share-hint"
        >
          {t("summary.fromShareHint")}
        </div>
      )}
    </>
  );
}
