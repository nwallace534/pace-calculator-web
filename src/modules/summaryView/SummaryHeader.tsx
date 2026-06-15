import { useTranslation } from "react-i18next";
import type { EditableTitle } from "@/hooks/useEditableTitle";
import CheckIcon from "@/assets/icons/check.svg?react";
import PencilIcon from "@/assets/icons/pencil.svg?react";

// Two-column flex so the title wraps before colliding with the fixed-size branding.
export function SummaryHeader({
  title,
  controlsVisible,
  eventLabel,
  friendlyGoalTime,
  distanceLine,
  titleMaxLength,
  onStartEdit,
  onFinishEdit,
}: {
  title: EditableTitle;
  controlsVisible: boolean;
  eventLabel: string;
  friendlyGoalTime: string;
  distanceLine: string;
  titleMaxLength: number;
  onStartEdit: () => void;
  onFinishEdit: () => void;
}) {
  const { t } = useTranslation("calculator");

  return (
    <div className="d-flex align-items-start gap-3">
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <div
          className="d-flex align-items-center gap-2"
          style={{ minWidth: 0 }}
          data-testid="summary-title-row"
        >
          {title.editing ? (
            <>
              <input
                type="text"
                maxLength={titleMaxLength}
                value={title.draftTitle}
                onChange={(e) => title.setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onFinishEdit();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                data-testid="summary-title-input"
                className="form-control form-control-sm flex-grow-1 summary-card-title"
                style={{ minWidth: 0 }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFinishEdit();
                }}
                data-testid="summary-title-save"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                aria-label={t("summary.saveTitle")}
                style={{ flexShrink: 0 }}
              >
                <CheckIcon />
              </button>
            </>
          ) : (
            <>
              <span
                className="summary-card-title"
                style={{ minWidth: 0, wordBreak: "break-word" }}
                data-testid="summary-title-display"
              >
                {title.customTitle ?? t("summary.goalHeading")}
              </span>
              {controlsVisible && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit();
                  }}
                  data-testid="summary-title-edit"
                  className="btn btn-link p-0 text-muted d-inline-flex align-items-center"
                  aria-label={t("summary.editTitle")}
                  style={{ lineHeight: 1, flexShrink: 0 }}
                >
                  <PencilIcon />
                </button>
              )}
            </>
          )}
        </div>

        <div
          className="summary-card-details-line"
          data-testid="summary-details-line"
        >
          {eventLabel} | {friendlyGoalTime} |{" "}
          <span style={{ whiteSpace: "nowrap" }}>{distanceLine}</span>
        </div>
      </div>
      <div className="summary-branding" data-testid="summary-branding">
        <img
          src="/pacerly-logo.svg"
          alt="Pacerly"
          width="32"
          height="32"
          style={{ display: "block", margin: "0 auto" }}
        />
        <div className="summary-branding-text">PACERLY.COM</div>
      </div>
    </div>
  );
}
