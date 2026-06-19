import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import CopyIcon from "@/assets/icons/copy.svg?react";
import { CloseButton } from "./icons";

// Single fadeStyle so all four control elements fade in lockstep.
export function SummaryControls({
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
      <div
        data-testid="summary-controls-left"
        className="summary-controls-anchor-left"
        style={fadeStyle}
      >
        <button
          type="button"
          onClick={onCopy}
          data-testid="summary-copy-link"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 summary-controls-button"
        >
          <CopyIcon />
          <span>{t("summary.copyLink")}</span>
        </button>
      </div>

      <div
        data-testid="summary-controls-right"
        className="summary-controls-anchor-right"
        style={fadeStyle}
      >
        <CloseButton onClick={onClose} ariaLabel={t("summary.close")} />
      </div>

      <div
        data-testid="summary-screenshot-mode-toast"
        className="text-smallish summary-screenshot-toast"
        style={fadeStyle}
      >
        {t("summary.screenshotModeToast")}
      </div>

      {arrivedFromShare && (
        <div
          className="mx-auto mb-2 text-center text-muted text-smallish summary-from-share-hint"
          style={fadeStyle}
          data-testid="summary-from-share-hint"
        >
          {t("summary.fromShareHint")}
        </div>
      )}
    </>
  );
}
