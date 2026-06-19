import CloseIcon from "@/assets/icons/close.svg?react";

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
      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center summary-controls-button"
      style={{ lineHeight: 1, padding: "0.25rem 0.4rem" }}
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
