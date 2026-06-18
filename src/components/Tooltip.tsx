import { createPopper, Instance, Placement } from "@popperjs/core";
import {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
  useRef,
  useState,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import "./Tooltip.css";

// iOS Safari withholds the first click on elements with hover listeners
// (first-tap-is-hover). Skipping mouseenter/leave on touch devices lets the
// first tap fire click and toggle the tooltip.
const HOVER_CAPABLE =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(hover: hover)").matches
    : true;

type TooltipProps = {
  content: ReactNode;
  placement?: Placement;
  /** Hover-show delay in ms. 100ms feels responsive without flickering on brush-by. */
  showDelay?: number;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  children: ReactElement;
};

// Portaled so it can escape surrounding overflow / stacking contexts
// (Bootstrap dropdown menus in particular).
export function Tooltip({
  content,
  placement = "top",
  showDelay = 100,
  wrapperClassName = "d-inline-block",
  wrapperStyle,
  children,
}: TooltipProps) {
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<number | null>(null);
  const popperRef = useRef<Instance | null>(null);

  useEffect(() => {
    if (show && triggerRef.current && tooltipRef.current) {
      popperRef.current = createPopper(triggerRef.current, tooltipRef.current, {
        placement,
        modifiers: [
          { name: "offset", options: { offset: [0, 8] } },
          { name: "preventOverflow", options: { boundary: "viewport" } },
          {
            name: "flip",
            options: { fallbackPlacements: ["bottom", "left", "right"] },
          },
        ],
      });
    }
    return () => {
      popperRef.current?.destroy();
      popperRef.current = null;
    };
  }, [show, placement]);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, []);

  // The Dropdown's outside-click only closes the menu; our portal lives on
  // body so it needs its own dismissal.
  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        tooltipRef.current?.contains(target)
      ) {
        return;
      }
      setShow(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [show]);

  // Auto-dismiss fallback — touch devices have no hover-out so a forgotten
  // tooltip would otherwise linger forever.
  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(id);
  }, [show]);

  const cancelPendingShow = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  };

  const handleEnter = () => {
    cancelPendingShow();
    showTimerRef.current = window.setTimeout(() => setShow(true), showDelay);
  };
  const handleLeave = () => {
    cancelPendingShow();
    setShow(false);
  };
  const handleClick = (e: ReactMouseEvent) => {
    // Don't bubble to a wrapping dropdown's close-on-click handler.
    e.stopPropagation();
    cancelPendingShow();
    setShow((s) => !s);
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={wrapperClassName}
        style={{ cursor: "pointer", ...wrapperStyle }}
        onMouseEnter={HOVER_CAPABLE ? handleEnter : undefined}
        onMouseLeave={HOVER_CAPABLE ? handleLeave : undefined}
        onClick={handleClick}
      >
        {children}
      </span>
      {show &&
        createPortal(
          <div ref={tooltipRef} role="tooltip" className="custom-tooltip">
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
