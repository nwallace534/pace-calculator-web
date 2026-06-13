import type { CSSProperties } from "react";

// Shared section-title look: bolder and body-colored (not muted) so titles
// read as titles. Fixed size — dynamic scaling was making things worse.
export const sectionTitleStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: "1rem",
  lineHeight: 1.2,
};

// Replacement for `.output` on row values. Same monospace + accent look, but
// no `font-size: 1.25rem !important` so the value inherits the row's size and
// stays consistent with section labels.
export const valueStyle: CSSProperties = {
  fontFamily: "var(--bs-font-monospace)",
  fontWeight: 200,
  color: "var(--accent)",
};
