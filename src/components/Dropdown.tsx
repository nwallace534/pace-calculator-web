import { createPopper, Instance, Placement } from "@popperjs/core";
import { ReactNode, useRef, useState, useEffect } from "react";
import "./Dropdown.css";

type DropdownProps = {
  children: ReactNode;
  menu: ReactNode;
  placement?: Placement;
  offset?: [number, number];
};

export default function Dropdown({
  children,
  menu,
  placement = "bottom-end",
  offset = [0, 4],
}: DropdownProps) {
  const [show, setShow] = useState(false);
  const buttonRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const popperInstanceRef = useRef<Instance | null>(null);

  useEffect(() => {
    if (show && buttonRef.current && menuRef.current) {
      popperInstanceRef.current = createPopper(
        buttonRef.current,
        menuRef.current,
        {
          placement,
          modifiers: [
            { name: "offset", options: { offset } },
            { name: "preventOverflow", options: { boundary: "viewport" } },
            { name: "flip", options: { fallbackPlacements: ["top-start"] } },
          ],
        },
      );
    }

    return () => {
      if (popperInstanceRef.current) {
        popperInstanceRef.current.destroy();
        popperInstanceRef.current = null;
      }
    };
  }, [show, placement, offset]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShow(false);
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShow(false);
      }
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show]);

  const handleMenuClick = () => {
    setTimeout(() => setShow(false), 0); // Let item onClick run first
  };

  return (
    <div className="d-inline-block position-relative">
      <span
        ref={buttonRef}
        onClick={() => setShow((prev) => !prev)}
        style={{ cursor: "pointer" }}
      >
        {children}
      </span>

      <div
        ref={menuRef}
        className={`dropdown-menu custom-dropdown ${show ? "show" : ""}`}
        style={{
          display: show ? "block" : "none",
          position: "absolute",
          zIndex: 1050,
        }}
        data-popper-placement={placement}
        onClick={handleMenuClick}
      >
        {menu}
      </div>
    </div>
  );
}
