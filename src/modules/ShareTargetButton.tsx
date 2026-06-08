import { createPopper, Instance } from "@popperjs/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useCalculatorStore from "@/state/useCalculatorStore";
import { buildShareUrl } from "@/utils/shareTarget";

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

function ShareTargetButton() {
  const { t } = useTranslation("calculator");
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const urlBoxRef = useRef<HTMLDivElement>(null);
  const popperRef = useRef<Instance | null>(null);

  const url = useMemo(() => {
    if (!open) return "";
    return buildShareUrl(useCalculatorStore.getState(), window.location);
  }, [open]);

  const closePopover = useCallback(() => {
    setOpen(false);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (open && buttonRef.current && popoverRef.current) {
      popperRef.current = createPopper(buttonRef.current, popoverRef.current, {
        placement: "top-end",
        modifiers: [
          { name: "offset", options: { offset: [0, 6] } },
          { name: "preventOverflow", options: { boundary: "viewport" } },
          { name: "flip", options: { fallbackPlacements: ["bottom-end"] } },
        ],
      });
    }

    return () => {
      popperRef.current?.destroy();
      popperRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !popoverRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        closePopover();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopover();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePopover, open]);

  const handleToggle = () => {
    if (open) {
      closePopover();
      return;
    }

    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setFeedback(t("share.copied"));
    } catch {
      setFeedback(t("share.copyFailed"));
    }
  };

  const selectUrlText = () => {
    const node = urlBoxRef.current;
    if (!node) return;

    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  return (
    <div className="d-inline-block position-relative">
      {open && (
        <button
          type="button"
          className="share-backdrop"
          aria-label={t("share.close")}
          onClick={closePopover}
        />
      )}
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center justify-content-center"
        style={{
          color: "var(--bs-emphasis-color)",
          borderWidth: "2px",
          borderColor: "var(--bs-emphasis-color)",
        }}
        aria-label={t("share.button")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={handleToggle}
      >
        <ShareIcon />
      </button>

      <div
        ref={popoverRef}
        role="dialog"
        aria-label={t("share.popoverTitle")}
        className="card shadow p-3 share-popover"
        style={{
          display: open ? "block" : "none",
          position: "absolute",
          zIndex: 1050,
        }}
      >
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <p className="text-smallish fw-bold mb-0">{t("share.popoverText")}</p>
          <button
            type="button"
            className="btn-close btn-close-sm"
            aria-label={t("share.close")}
            onClick={closePopover}
          />
        </div>
        <div className="d-flex gap-2 align-items-center">
          <div
            ref={urlBoxRef}
            className="form-control share-url-box"
            onClick={selectUrlText}
            aria-label={t("share.urlLabel")}
          >
            {url}
          </div>
          <button
            type="button"
            className="btn btn-accent btn-sm text-nowrap"
            onClick={handleCopy}
          >
            {t("share.copyLink")}
          </button>
        </div>

        {feedback && (
          <div className="text-muted text-smallish mt-2" role="status">
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareTargetButton;
