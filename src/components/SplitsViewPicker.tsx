import { Fragment, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Placement } from "@popperjs/core";
import Dropdown from "@/components/Dropdown";
import { Tooltip } from "@/components/Tooltip";
import type { SplitsOverrideOption } from "@/utils/splitsOverride";
import type { SplitsViewOption } from "@/hooks/useSplitsOverride";
import InfoIcon from "@/assets/icons/info.svg?react";

type Props = {
  selected: SplitsOverrideOption;
  options: SplitsViewOption[];
  onSelect: (option: SplitsOverrideOption) => void;
  /** bottom-end for right-anchored triggers, bottom-start for left-anchored. */
  placement?: Placement;
  /** Custom trigger element; defaults to the selected unit label with chevron. */
  children?: ReactNode;
};

// Hides when only one option is enabled (sprints) since there's nothing to
// switch to.
export function SplitsViewPicker({
  selected,
  options,
  onSelect,
  placement = "bottom-end",
  children,
}: Props) {
  const { t } = useTranslation();

  const enabledCount = options.filter((o) => o.enabled).length;
  if (enabledCount <= 1) return null;

  const menu = (
    <>
      {options.map(({ option, enabled, disabledReasonKey }, index) => {
        const button = (
          <button
            type="button"
            className={`dropdown-item d-flex align-items-center justify-content-between${
              enabled ? "" : " disabled"
            }${option.key === selected.key ? " active" : ""}`}
            aria-disabled={!enabled}
            onClick={enabled ? () => onSelect(option) : undefined}
            data-testid={`splits-view-option-${option.key}`}
          >
            <span>{t(option.i18nKey)}</span>
            {/* Purely a visual hint — the tooltip is on the wrapping span. */}
            {!enabled && (
              <InfoIcon width={14} height={14} className="ms-2 flex-shrink-0" />
            )}
          </button>
        );

        const item =
          !enabled && disabledReasonKey ? (
            <Tooltip
              content={t(disabledReasonKey)}
              wrapperClassName="d-block"
              wrapperStyle={{ cursor: "not-allowed" }}
            >
              {button}
            </Tooltip>
          ) : (
            button
          );

        return (
          <Fragment key={option.key}>
            {index > 0 && <hr className="dropdown-divider" />}
            {item}
          </Fragment>
        );
      })}
    </>
  );

  const defaultTrigger = (
    <button
      type="button"
      className="btn btn-link btn-sm p-0 text-muted text-smallish dropdown-toggle"
      data-testid="splits-view-picker-toggle"
    >
      {t(selected.i18nKey)}
    </button>
  );

  return (
    <Dropdown menu={menu} placement={placement}>
      {children ?? defaultTrigger}
    </Dropdown>
  );
}
