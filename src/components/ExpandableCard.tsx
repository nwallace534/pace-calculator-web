import React from "react";
import IconChevron from "@/assets/icon-chevron.svg?react";

type ExpandableCardProps = {
  isExpanded: boolean;
  handleToggle: (isExpanded: boolean) => void;
  title: string;
  testId?: string;
  children?: React.ReactNode;
};

export const ExpandableCard = ({
  isExpanded,
  handleToggle,
  title,
  testId,
  children,
}: ExpandableCardProps) => {
  return (
    <div
      data-testid={testId}
      className="card rounded-3 border-0 mt-3"
      style={{
        backgroundColor: "var(--bs-secondary-bg)",
        color: "var(--bs-body-color)",
      }}
    >
      <div className={`card-header ${isExpanded ? "" : "border-0"}`}>
        <button
          type="button"
          className="d-flex justify-content-between align-items-center w-100 p-0 border-0 bg-transparent text-start text-body"
          aria-expanded={isExpanded}
          onClick={() => handleToggle(!isExpanded)}
        >
          <h5 className="mb-0">{title}</h5>

          <IconChevron
            width="1.75rem"
            height="1.75rem"
            className={`rotatable-icon ${isExpanded ? "rotated" : ""}`}
          />
        </button>
      </div>

      {isExpanded && <div className="px-3 py-2">{children}</div>}
    </div>
  );
};
