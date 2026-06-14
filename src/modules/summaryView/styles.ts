import type { CSSProperties } from "react";

export const sectionTitleStyle: CSSProperties = {
  fontWeight: 700,
  fontSize: "1rem",
  lineHeight: 1.2,
};

// Replaces `.output` so the value inherits row font-size instead of locking 1.25rem.
export const valueStyle: CSSProperties = {
  fontFamily: "var(--bs-font-monospace)",
  fontWeight: 200,
  color: "var(--accent)",
};
