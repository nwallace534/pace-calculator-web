import type { CSSProperties } from "react";

export const sectionTitleStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: "1rem",
  lineHeight: 1.2,
};

// Replaces `.output` on row values — same monospace/accent look but inherits
// font-size from the row instead of locking 1.25rem.
export const valueStyle: CSSProperties = {
  fontFamily: "var(--bs-font-monospace)",
  fontWeight: 200,
  color: "var(--accent)",
};
