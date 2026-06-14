// Icons are inline so they pick up `currentColor` for the theme/chrome
// colour swap without per-asset variants.

export function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function CopyIcon({ size = 14 }: { size?: number } = {}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function PencilIcon({ size = 20 }: { size?: number } = {}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function CloseButton({
  onClick,
  ariaLabel,
}: {
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="summary-close"
      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
      style={{
        lineHeight: 1,
        padding: "0.25rem 0.4rem",
        color: "var(--summary-chrome-color)",
        borderColor: "var(--summary-chrome-color)",
      }}
      aria-label={ariaLabel}
    >
      <CloseIcon />
    </button>
  );
}

// Flex-grow with a max so sparse goals get breathing space and dense ones still get a perceptible gap.
export function SectionSpacer() {
  return (
    <div
      aria-hidden="true"
      style={{
        flexGrow: 1,
        flexShrink: 0,
        minHeight: "0.8rem",
        maxHeight: "2rem",
        display: "flex",
        alignItems: "center",
      }}
    >
      <hr className="w-100 m-0" />
    </div>
  );
}
