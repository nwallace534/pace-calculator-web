import { useTranslation } from "react-i18next";
import type { EditableTitle } from "@/hooks/useEditableTitle";
import { CheckIcon, PencilIcon } from "./icons";

// Title row (editable input ↔ display) + details line + branding cluster.
// Two-column flex so the title can wrap without colliding with the right-side
// branding, which never shrinks.
export function SummaryHeader({
  title,
  chromeVisible,
  eventLabel,
  friendlyGoalTime,
  distanceLine,
  titleMaxLength,
  onStartEdit,
  onFinishEdit,
}: {
  title: EditableTitle;
  chromeVisible: boolean;
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
        {/* Editable card title. Defaults to the i18n value of
            summary.goalHeading; saved edits override. Accent-coloured, bigger
            than every other heading. Pencil sits beside it in display mode,
            replaced by the input + check while editing. */}
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
                className="form-control form-control-sm flex-grow-1"
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "var(--accent)",
                  minWidth: 0,
                }}
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
                style={{
                  color: "var(--accent)",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  minWidth: 0,
                  wordBreak: "break-word",
                }}
                data-testid="summary-title-display"
              >
                {title.customTitle ?? t("summary.goalHeading")}
              </span>
              {chromeVisible && (
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

        {/* Detail line beneath the title — event • friendly time • equivalent
            distance. Body-coloured (matches the calculator's label tone) so
            it reads darker than the previous muted look. */}
        <div
          style={{
            fontSize: "0.9rem",
            lineHeight: 1.3,
            marginTop: "0.25rem",
            color: "var(--bs-body-color)",
          }}
          data-testid="summary-details-line"
        >
          {eventLabel} | {friendlyGoalTime} |{" "}
          <span style={{ whiteSpace: "nowrap" }}>{distanceLine}</span>
        </div>
      </div>
      <div
        className="text-center"
        style={{ flexShrink: 0, lineHeight: 1.1 }}
        data-testid="summary-branding"
      >
        <img
          src="/pacerly-logo.svg"
          alt="Pacerly"
          width="32"
          height="32"
          style={{ display: "block", margin: "0 auto" }}
        />
        <div
          style={{
            fontFamily: "'Noto Sans', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.12em",
            fontSize: "0.65rem",
            lineHeight: 1,
            marginTop: "0.3rem",
          }}
        >
          PACERLY.COM
        </div>
      </div>
    </div>
  );
}
