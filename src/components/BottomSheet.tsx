import { ReactNode, CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type BottomSheetProps = {
  title: string;
  closeAriaLabel: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  sheetStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
  lockPageScroll?: boolean;
};

function BottomSheet({
  title,
  closeAriaLabel,
  onClose,
  children,
  maxWidth = "480px",
  sheetStyle,
  bodyStyle,
  lockPageScroll = false,
}: BottomSheetProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!lockPageScroll) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [lockPageScroll]);

  return createPortal(
    <>
      <div
        className={`offcanvas-backdrop fade ${shown ? "show" : ""}`}
        onClick={onClose}
      />
      <div
        className={`offcanvas offcanvas-bottom ${shown ? "show" : ""}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{ visibility: "visible", ...sheetStyle }}
      >
        <div
          className="mx-auto w-100 d-flex flex-column flex-grow-1"
          style={{ maxWidth }}
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label={closeAriaLabel}
              onClick={onClose}
            />
          </div>
          <div className="offcanvas-body" style={bodyStyle}>
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

export default BottomSheet;
