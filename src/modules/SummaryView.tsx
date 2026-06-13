import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  calculateSplits,
  DistanceUnit,
  getDistanceInAllUnits,
  Time,
} from "pace-calculator";
import type { SplitsResult } from "@/utils/calculator";
import useCalculatorStore from "@/state/useCalculatorStore";
import { formatTime, formatNaturalDuration } from "@/utils/formatTime";
import { DistanceMode } from "@/types/distance";
import {
  DistanceUnitShortLabel,
  formatDistanceValue,
  formatDistanceValueTwoDp,
} from "@/utils/distances";
import { getDecimalValue, getNumericValue } from "@/utils/input";
import { getVisibleTimeFields } from "@/utils/events";
import { buildShareUrl } from "@/utils/shareTarget";
import {
  buildIntervalRows,
  buildSummaryPredictionRows,
  formatFriendlyTimeExact,
} from "@/modules/summaryRows";

// Short forms for the column layout. Catalog labels are correct globally
// (event picker etc.), but "Half Marathon" makes the prediction column too
// wide; "Half" reads fine in context with the time beside it.
const SHORT_EVENT_LABELS: Record<string, string> = {
  halfMarathon: "1/2 Mar",
};

const getSplitsUnitKey = (
  unit: DistanceUnit | undefined,
): "miles" | "meters" | "kilometers" | null => {
  if (unit === DistanceUnit.Miles) return "miles";
  if (unit === DistanceUnit.Meters) return "meters";
  if (unit === DistanceUnit.Kilometers) return "kilometers";
  return null;
};

const getSplitsColumnCount = (rowCount: number): number => {
  if (rowCount > 16) return 3;
  if (rowCount > 8) return 2;
  return 1;
};

// Flex-grow separator: gap that can stretch when the card has spare height,
// bounded so sparse goals don't grow embarrassingly large blank bands. The
// hr inside is centered vertically and gets the standard Bootstrap muted
// look, so visually it still reads as a section divider.
function SectionSpacer() {
  return (
    <div
      aria-hidden="true"
      style={{
        flexGrow: 1,
        flexShrink: 0,
        // Bumped both ends so sparse goals have visible breathing between
        // sections and dense ones (marathon) still get a perceptible gap.
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

function CloseIcon() {
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

function CloseButton({
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

function CopyIcon({ size = 14 }: { size?: number } = {}) {
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

function PencilIcon({ size = 20 }: { size?: number } = {}) {
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

function CheckIcon() {
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

const TITLE_MAX_LENGTH = 50;

const COPY_TOAST_DURATION_MS = 3000;

function CopyToast({
  message,
  url,
  onDismiss,
}: {
  message: string;
  url?: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onDismiss, COPY_TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [onDismiss, message, url]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="position-fixed start-50 translate-middle-x"
      style={{
        bottom: "1.5rem",
        zIndex: 1080,
        maxWidth: "min(28rem, 90vw)",
      }}
    >
      <div
        className="shadow rounded-3 px-3 py-2"
        style={{
          backgroundColor: "var(--bs-body-bg)",
          color: "var(--bs-body-color)",
          border: "1px solid var(--bs-border-color)",
        }}
      >
        <div className="fw-bold text-smallish">✓ {message}</div>
        {url && (
          <div
            className="text-muted text-small font-monospace text-truncate"
            style={{ marginTop: "0.15rem" }}
          >
            {url}
          </div>
        )}
      </div>
    </div>
  );
}

const getEventLabelText = ({
  event,
  distanceWhole,
  distanceFractional,
  distanceUnit,
  eventLabel,
}: {
  event: string;
  distanceWhole: string;
  distanceFractional: string;
  distanceUnit: DistanceUnit;
  eventLabel: string;
}): string => {
  if (event === DistanceMode.Custom || event === DistanceMode.CustomTrack) {
    const value =
      getNumericValue(distanceWhole) + getDecimalValue(distanceFractional);
    return `${formatDistanceValue(value)}${DistanceUnitShortLabel[distanceUnit]}`;
  }
  return eventLabel;
};

function SummaryView() {
  const { t } = useTranslation(["calculator", "events"]);

  const closeSummaryView = useCalculatorStore((s) => s.closeSummaryView);
  const event = useCalculatorStore((s) => s.event);
  const paceResults = useCalculatorStore((s) => s.paceResults);
  const storeSplits = useCalculatorStore((s) => s.splits);
  const distanceWhole = useCalculatorStore((s) => s.distanceWhole);
  const distanceFractional = useCalculatorStore((s) => s.distanceFractional);
  const distanceUnit = useCalculatorStore((s) => s.distanceUnit);
  const timeHours = useCalculatorStore((s) => s.timeHours);
  const timeMinutes = useCalculatorStore((s) => s.timeMinutes);
  const timeSeconds = useCalculatorStore((s) => s.timeSeconds);
  const timeHundredths = useCalculatorStore((s) => s.timeHundredths);
  const arrivedFromShare = useCalculatorStore((s) => s.summaryArrivedFromShare);

  // Recomputed when the underlying state changes — kept reactive so the URL
  // preview always reflects the actual link the Copy button will produce.
  // Body reads via useCalculatorStore.getState() rather than the hook values
  // directly, so eslint flags the deps as "unused"; they're still load-bearing
  // for triggering the recompute on input edits.
  const shareUrl = useMemo(() => {
    return buildShareUrl(useCalculatorStore.getState(), window.location, {
      view: "summary",
      fromShare: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    event,
    distanceWhole,
    distanceFractional,
    distanceUnit,
    timeHours,
    timeMinutes,
    timeSeconds,
    timeHundredths,
  ]);

  const [toast, setToast] = useState<{ message: string; url?: string } | null>(
    null,
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast({ message: t("calculator:share.toastCopied"), url: shareUrl });
    } catch {
      setToast({ message: t("calculator:share.copyFailed") });
    }
  };

  // Screenshot-mode chrome: header controls + orientation text fade in on
  // load, hold for 5s, fade out. Any tap on the view restarts the cycle
  // with the same 5s display window. Card position never shifts because the
  // controls are absolutely positioned outside its flow.
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = useCallback((delayMs: number) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, delayMs);
  }, []);

  useEffect(() => {
    // Mount with controls invisible, then flip on next frame so the opacity
    // transition fires (no flash; controls appear via the fade-in).
    const rafId = requestAnimationFrame(() => {
      setControlsVisible(true);
      scheduleHide(3000);
    });
    return () => {
      cancelAnimationFrame(rafId);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [scheduleHide]);

  const handleRevealControls = () => {
    // While editing, the controls are pinned visible and shouldn't reset
    // the hide timer — let the edit/save action drive visibility instead.
    if (editing) return;
    setControlsVisible(true);
    scheduleHide(3000);
  };

  // Shared opacity/pointer-events transition so all chrome fades as one.
  const controlsFadeStyle: CSSProperties = {
    opacity: controlsVisible ? 1 : 0,
    pointerEvents: controlsVisible ? "auto" : "none",
    transition: "opacity 500ms ease",
  };

  // Editable title state — useState must be declared unconditionally before
  // the early-return below to keep hook order stable. `displayTitle` and the
  // edit handlers reference `headingText`, so they're computed further down
  // once it's available.
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  // While `closing` is true we swap the flip-in animation for its reverse
  // (.summary-card-flip-out). The actual unmount fires from the card's
  // onAnimationEnd handler so the animation has time to finish.
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
  };

  const handleCardAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    // Unmount when the dedicated close keyframe finishes. The open animation
    // (`summary-card-flip-in`) also fires here on mount; we ignore it.
    if (closing && e.animationName === "summary-card-flip-out") {
      closeSummaryView();
    }
  };

  // Local splits override — does NOT touch store. Closing the card discards
  // the choice. Hooks live above the early-return so the order is stable;
  // distanceAllUnits is recomputed inline so the deps are primitives.
  const [splitsOverride, setSplitsOverride] = useState<
    "K" | "miles" | "100m" | null
  >(null);

  const overrideSplits: SplitsResult | null = useMemo(() => {
    if (splitsOverride === null) return null;
    const distanceValue =
      getNumericValue(distanceWhole) + getDecimalValue(distanceFractional);
    const distanceAll = getDistanceInAllUnits({
      distanceValue,
      distanceUnit,
    });
    const inputTime: Time = {
      hours: getNumericValue(timeHours),
      minutes: getNumericValue(timeMinutes),
      seconds: getNumericValue(timeSeconds),
      milliseconds: getNumericValue(timeHundredths) * 10,
    };
    if (splitsOverride === "K") {
      return {
        unit: DistanceUnit.Kilometers,
        showHundredths: false,
        trackSummary: null,
        rows: calculateSplits({
          time: inputTime,
          distance: distanceAll.inKilometers,
          splitInterval: 1,
        }),
      };
    }
    if (splitsOverride === "miles") {
      return {
        unit: DistanceUnit.Miles,
        showHundredths: false,
        trackSummary: null,
        rows: calculateSplits({
          time: inputTime,
          distance: distanceAll.inMiles,
          splitInterval: 1,
        }),
      };
    }
    // 100m
    return {
      unit: DistanceUnit.Meters,
      showHundredths: false,
      trackSummary: null,
      rows: calculateSplits({
        time: inputTime,
        distance: distanceAll.inMeters,
        splitInterval: 100,
      }),
    };
  }, [
    splitsOverride,
    distanceWhole,
    distanceFractional,
    distanceUnit,
    timeHours,
    timeMinutes,
    timeSeconds,
    timeHundredths,
  ]);

  if (!paceResults) {
    // Defensive: the entry button is only rendered alongside paceResults, but
    // if state changes (e.g. distance cleared via share-link load), bail out
    // gracefully back to the calculator.
    return (
      <div className="container py-3 d-flex justify-content-end">
        <CloseButton
          onClick={closeSummaryView}
          ariaLabel={t("calculator:summary.close")}
        />
      </div>
    );
  }

  const { showHundredths } = getVisibleTimeFields(event);
  const goalTimeRaw = {
    hours: getNumericValue(timeHours),
    minutes: getNumericValue(timeMinutes),
    seconds: getNumericValue(timeSeconds),
    milliseconds: getNumericValue(timeHundredths) * 10,
  };
  // Sprints / track / custom-track events stash precision in hundredths;
  // surface that in every friendly-time render (goal title, predictions,
  // intervals) so a 9.58 100m doesn't read as a flat "9s".
  const showHundredthsInFriendly = showHundredths;
  const friendlyGoalTime = formatFriendlyTimeExact(
    goalTimeRaw,
    showHundredthsInFriendly,
  );

  const eventLabel = getEventLabelText({
    event,
    distanceWhole,
    distanceFractional,
    distanceUnit,
    eventLabel: t(`events:event.${event}.label`, { defaultValue: "" }),
  });

  // Distance summary for the details line. For a miles event ("Marathon",
  // "Half Marathon", etc.) the event title doesn't carry the unit, so the
  // line shows both — "26.2 miles = 42.2 km". For km/meter events the title
  // already implies the metric, so we just show the imperial equivalent
  // ("5K | 25m 59s | 3.1 miles").
  const distanceAllUnits = getDistanceInAllUnits({
    distanceValue:
      getNumericValue(distanceWhole) + getDecimalValue(distanceFractional),
    distanceUnit,
  });
  const distanceInMiles = `${formatDistanceValueTwoDp(distanceAllUnits.inMiles.distanceValue)} miles`;
  const distanceInKm = `${formatDistanceValueTwoDp(distanceAllUnits.inKilometers.distanceValue)} km`;
  const distanceLine =
    distanceUnit === DistanceUnit.Miles
      ? `${distanceInMiles} = ${distanceInKm}`
      : distanceInMiles;

  // Splits override hooks are declared above the early-return; here we just
  // pick which result to render. `totalMeters` / `isMetersEvent` are local
  // derived values used by the toggle-action helper below.
  const totalMeters = distanceAllUnits.inMeters.distanceValue;
  const isMetersEvent = distanceUnit === DistanceUnit.Meters;
  const splits = overrideSplits ?? storeSplits;

  // What single override does the "Show in …" toggle offer next? Matches the
  // splits panel's single-button pattern (the panel uses `result.splitsInUnit`
  // for the same purpose). For road events it flips between km and miles;
  // for meter events it cycles K ↔ 100m once the user opts out of the event
  // landmarks. For sub-1km meter events only 100m is available, so the
  // button hides after the first click.
  // What single override does the "Show in …" toggle offer next? Returns
  // null when there's no useful action; otherwise carries the value to
  // set (null itself is a valid setTo — it reverts to the event landmarks).
  type NextSplitsAction = {
    setTo: "K" | "miles" | "100m" | null;
    label: string;
  } | null;
  const nextAction: NextSplitsAction = (() => {
    if (!splits) return null;
    if (isMetersEvent) {
      // Long meter events (≥ 1km): cycle landmarks ↔ K. No 100m — 30+
      // 100-metre splits is too noisy for a 3km card (and worse beyond).
      if (totalMeters >= 1000) {
        if (splitsOverride === null) return { setTo: "K", label: "K" };
        if (splitsOverride === "K") return { setTo: null, label: "laps" };
        return null;
      }
      // 400m < total ≤ 800m: cycle landmarks ↔ 100m. Above 800m the
      // 100m count gets unwieldy; below 400m the default splits are
      // already at 100m landmarks so there's nothing to toggle to.
      if (totalMeters > 400 && totalMeters <= 800) {
        if (splitsOverride === null) return { setTo: "100m", label: "100m" };
        if (splitsOverride === "100m") return { setTo: null, label: "laps" };
        return null;
      }
      return null;
    }
    if (splits.unit === DistanceUnit.Kilometers) {
      return { setTo: "miles", label: "miles" };
    }
    if (splits.unit === DistanceUnit.Miles) {
      return { setTo: "K", label: "K" };
    }
    return null;
  })();

  const startEdit = () => {
    // Editable note is a free-form field, defaulting to whatever the user
    // last typed (or blank if they've never edited it on this card).
    setDraftTitle(customTitle ?? "");
    setEditing(true);
    // Pin controls open and stop the hide countdown for the duration of the
    // edit; finishEdit will trigger the fade.
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  const finishEdit = () => {
    const trimmed = draftTitle.trim().slice(0, TITLE_MAX_LENGTH);
    setCustomTitle(trimmed.length > 0 ? trimmed : null);
    setEditing(false);
    // Per spec: finishing the edit fades all controls immediately.
    setControlsVisible(false);
  };

  const predictionRows = buildSummaryPredictionRows({
    distanceWhole,
    distanceFractional,
    distanceUnit,
    timeHours,
    timeMinutes,
    timeSeconds,
    timeHundredths,
  });

  const intervalRows = buildIntervalRows({
    paceResults,
    distanceWhole,
    distanceFractional,
    distanceUnit,
  });

  const splitsUnitKey = getSplitsUnitKey(splits?.unit);
  const splitsHeadingUnit = splitsUnitKey
    ? t(`calculator:summary.splitsUnit.${splitsUnitKey}`)
    : "";

  // Label per split: track events use the cumulative meter landmark (300, 700,
  // …) since those carry meaning; road events index by integer split number
  // (the unit is in the heading), keeping any partial-distance tail row honest.
  const formatSplitLabel = (distance: number, splitNumber: number) => {
    if (splits?.unit === DistanceUnit.Meters) return `${distance}`;
    if (Number.isInteger(distance)) return `${splitNumber}`;
    return distance.toFixed(2);
  };

  const splitsColumnCount = getSplitsColumnCount(splits?.rows.length ?? 0);
  // CSS Grid with explicit row count + column-flow so each split row is
  // strictly contained in its grid cell — no chance of leaking into the next
  // column the way CSS multi-column was doing. Trades perfect time alignment
  // for guaranteed-no-overlap, which the user explicitly preferred.
  const splitsRowsPerColumn = Math.ceil(
    (splits?.rows.length ?? 0) / Math.max(1, splitsColumnCount),
  );

  // Shared section-title look: bolder and body-colored (not muted) so titles
  // read as titles. Fixed size — dynamic scaling was making things worse.
  const sectionTitleStyle: CSSProperties = {
    fontWeight: 700,
    fontSize: "1rem",
    lineHeight: 1.2,
  };

  // Replacement for `.output` on row values. Same monospace + accent look,
  // but no `font-size: 1.25rem !important` so the value inherits the row's
  // size and stays consistent with section labels.
  const valueStyle: CSSProperties = {
    fontFamily: "var(--bs-font-monospace)",
    fontWeight: 200,
    color: "var(--accent)",
  };

  return (
    <div
      className="px-3"
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        paddingTop: "3rem",
        paddingBottom: "1rem",
      }}
      data-testid="summary-view"
      onClick={() => {
        // Any click that bubbles up while editing the title commits the
        // change and exits edit mode. The input + check button both
        // stopPropagation, so this only fires for taps outside them.
        if (editing) {
          finishEdit();
          return;
        }
        handleRevealControls();
      }}
      onMouseMove={handleRevealControls}
    >
      {/* Header controls — absolutely positioned so they fade in/out without
          shifting the card. Both share the same fade transition and the
          wrapper's reveal-on-tap restarts the hide timer. */}
      <div
        data-testid="summary-controls-left"
        style={{
          position: "absolute",
          top: "0.75rem",
          left: "0.75rem",
          zIndex: 10,
          ...controlsFadeStyle,
        }}
      >
        <button
          type="button"
          onClick={handleCopy}
          data-testid="summary-copy-link"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
          style={{
            color: "var(--summary-chrome-color)",
            borderColor: "var(--summary-chrome-color)",
          }}
        >
          <CopyIcon />
          <span>{t("calculator:summary.copyLink")}</span>
        </button>
      </div>

      <div
        data-testid="summary-controls-right"
        style={{
          position: "absolute",
          top: "0.75rem",
          right: "0.75rem",
          zIndex: 10,
          ...controlsFadeStyle,
        }}
      >
        <CloseButton
          onClick={handleClose}
          ariaLabel={t("calculator:summary.close")}
        />
      </div>

      {/* "Screenshot mode" label — uses the same chrome colour as the
          surrounding buttons so all three controls share a contrast tone,
          without going as dark as pure emphasis. */}
      <div
        data-testid="summary-screenshot-mode-toast"
        className="text-smallish"
        style={{
          position: "absolute",
          top: "0.95rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          color: "var(--summary-chrome-color)",
          ...controlsFadeStyle,
        }}
      >
        {t("calculator:summary.screenshotModeToast")}
      </div>

      {arrivedFromShare && (
        <div
          className="mx-auto mb-2 text-center text-muted text-smallish"
          style={{ maxWidth: "28rem", ...controlsFadeStyle }}
          data-testid="summary-from-share-hint"
        >
          {t("calculator:summary.fromShareHint")}
        </div>
      )}

      <div
        className={`card rounded-3 border-0 p-3 mx-auto position-relative d-flex flex-column ${
          closing ? "summary-card-flip-out" : "summary-card-flip-in"
        }`}
        onAnimationEnd={handleCardAnimationEnd}
        style={{
          backgroundColor: "var(--bs-secondary-bg)",
          color: "var(--bs-body-color)",
          // Width capped at the Pixel 9 Pro XL (largest mainstream portrait
          // phone, 448 × 998 CSS px ≈ 28 × 62.5rem). Height is a cap, not a
          // target — sparse goals shrink to fit content, marathon grows to
          // the cap and overflow-clips anything past it.
          maxWidth: "28rem",
          maxHeight: "62.5rem",
          overflow: "hidden",
        }}
        data-testid="summary-card"
      >
        {/* Two columns: goal title text (left, can shrink and wrap) and the
            branding cluster (right, fixed size, never shrinks). Putting them
            in a flex row instead of overlaying the branding absolutely
            guarantees the long heading line wraps before it can collide. */}
        <div className="d-flex align-items-start gap-3">
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            {/* Editable card title. Defaults to the i18n value of
                summary.goalHeading; saved edits override. Accent-coloured,
                bigger than every other heading. Pencil sits beside it
                in display mode, replaced by the input + check while editing. */}
            <div
              className="d-flex align-items-center gap-2"
              style={{ minWidth: 0 }}
              data-testid="summary-title-row"
            >
              {editing ? (
                <>
                  <input
                    type="text"
                    maxLength={TITLE_MAX_LENGTH}
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        finishEdit();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    data-testid="summary-title-input"
                    className="form-control form-control-sm flex-grow-1"
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "var(--accent)",
                      minWidth: 0,
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      finishEdit();
                    }}
                    data-testid="summary-title-save"
                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                    aria-label={t("calculator:summary.saveTitle")}
                    style={{ flexShrink: 0 }}
                  >
                    <CheckIcon />
                  </button>
                </>
              ) : (
                <>
                  <span
                    style={{
                      color: "var(--accent)",
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      minWidth: 0,
                      wordBreak: "break-word",
                    }}
                    data-testid="summary-title-display"
                  >
                    {customTitle ?? t("calculator:summary.goalHeading")}
                  </span>
                  {controlsVisible && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit();
                      }}
                      data-testid="summary-title-edit"
                      className="btn btn-link p-0 text-muted d-inline-flex align-items-center"
                      aria-label={t("calculator:summary.editTitle")}
                      style={{ lineHeight: 1, flexShrink: 0 }}
                    >
                      <PencilIcon />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Detail line beneath the title — event • friendly time •
                equivalent distance. Body-coloured (matches the calculator's
                label tone) so it reads darker than the previous muted look. */}
            <div
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.3,
                marginTop: "0.25rem",
                color: "var(--bs-body-color)",
              }}
              data-testid="summary-details-line"
            >
              {eventLabel} | {friendlyGoalTime} |{" "}
              <span style={{ whiteSpace: "nowrap" }}>{distanceLine}</span>
            </div>
          </div>
          <div
            className="text-center"
            style={{ flexShrink: 0, lineHeight: 1.1 }}
            data-testid="summary-branding"
          >
            <img
              src="/pacerly-logo.svg"
              alt="Pacerly"
              width="32"
              height="32"
              style={{ display: "block", margin: "0 auto" }}
            />
            <div
              style={{
                fontFamily: "'Noto Sans', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.12em",
                fontSize: "0.65rem",
                lineHeight: 1,
                marginTop: "0.3rem",
              }}
            >
              PACERLY.COM
            </div>
          </div>
        </div>

        <SectionSpacer />

        {/* Two columns, one per unit system: pace on top (headline), matching
            speed beneath at a smaller size. Speed values drop `.output` and
            inline its styles minus font-size, since the class locks 1.25rem
            with !important and would prevent shrinking. */}
        {/* Three columns: km pace, mi pace, and a smaller right-aligned
            stack with the two speed equivalents. Speed unit suffix carries
            its own label so the column doesn't need separate Kph/Mph titles.
            No parent gap; only the pace columns have an explicit gap between
            them, so the vertical divider can sit tight to the speeds column. */}
        {/* align-items: baseline aligns the first text baseline of each
            column, so "Per km" / "Per mile" / "10.0 kph" share a baseline,
            and the second line of each column lines up too because they
            share the same line-height. Mixing regular text (pace label) and
            monospace (everything else) would otherwise leave subtle vertical
            offsets between rows. */}
        <div className="d-flex align-items-baseline">
          <div className="flex-grow-1">
            <div>{t("calculator:result.pacePerKm")}</div>
            <output style={valueStyle}>
              {formatTime({ time: paceResults.perKilometer })}{" "}
              {t("calculator:unit.perKm")}
            </output>
          </div>
          <div className="flex-grow-1 ms-3">
            <div>{t("calculator:result.pacePerMile")}</div>
            <output style={valueStyle}>
              {formatTime({ time: paceResults.perMile })}{" "}
              {t("calculator:unit.perMile")}
            </output>
          </div>
          {/* Vertical equivalent of <hr>: currentColor + opacity 0.25,
              inset top/bottom so it doesn't span the full section height. */}
          <div
            aria-hidden="true"
            className="ms-2"
            style={{
              alignSelf: "stretch",
              width: "1px",
              backgroundColor: "currentColor",
              opacity: 0.25,
              marginTop: "0.3rem",
              marginBottom: "0.3rem",
            }}
          />
          <div className="ps-2 d-flex flex-column">
            <output style={valueStyle}>
              {paceResults.speedKph.toFixed(1)} {t("calculator:unit.kph")}
            </output>
            <output style={valueStyle}>
              {paceResults.speedMph.toFixed(1)} {t("calculator:unit.mph")}
            </output>
          </div>
        </div>

        {predictionRows.length > 0 && (
          <>
            <SectionSpacer />
            <div
              className="mb-1"
              style={sectionTitleStyle}
              data-testid="summary-predictions-heading"
            >
              {t("calculator:summary.predictionsHeading")}
            </div>
            <div
              data-testid="summary-predictions"
              style={{
                columnWidth: "8rem",
                columnGap: "0.25rem",
              }}
            >
              {predictionRows.map((row) => (
                <div
                  key={row.id}
                  data-testid="summary-prediction-row"
                  className="d-flex"
                  style={{
                    gap: "0.4rem",
                    breakInside: "avoid",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ minWidth: "4em" }}>
                    {SHORT_EVENT_LABELS[row.id] ??
                      t(`events:event.${row.id}.label`)}
                  </span>
                  <span style={valueStyle}>
                    {formatFriendlyTimeExact(
                      row.time,
                      showHundredthsInFriendly,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {intervalRows.length > 0 && (
          <>
            <SectionSpacer />
            <div className="mb-1" style={sectionTitleStyle}>
              {t("calculator:summary.intervalsHeading")}
            </div>
            <div
              data-testid="summary-intervals"
              style={{
                // Multi-column for responsive packing. No maxWidth — the card
                // already caps width at phone-portrait, so the inner sections
                // are free to use whatever room that leaves.
                columnWidth: "8rem",
                columnGap: "0.25rem",
              }}
            >
              {intervalRows.map((row) => (
                <div
                  key={row.label}
                  data-testid="summary-interval-row"
                  className="d-flex"
                  style={{
                    gap: "0.4rem",
                    breakInside: "avoid",
                    whiteSpace: "nowrap",
                  }}
                >
                  {/* Fixed label box so times line up at the same x position
                      across every row in a column. Sized to fit "3000m" /
                      "1/2 Mar" — the widest labels after the shortening. */}
                  <span style={{ minWidth: "4em" }}>{row.label}</span>
                  <span style={valueStyle}>
                    {formatFriendlyTimeExact(
                      row.time,
                      showHundredthsInFriendly,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {splits && splits.rows.length > 0 && (
          <>
            <SectionSpacer />
            {/* Row reserves enough height for the toggle button up front, so
                showing/hiding the button doesn't reflow the splits grid. */}
            <div
              className="d-flex align-items-center mb-1 gap-3"
              style={{ minHeight: "1.75rem" }}
            >
              <div style={sectionTitleStyle}>
                {t("calculator:summary.splitsHeading", {
                  unit: splitsHeadingUnit,
                })}
              </div>
              {controlsVisible && nextAction !== null && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSplitsOverride(nextAction.setTo);
                  }}
                  className="btn btn-link btn-sm p-0 text-muted text-smallish d-inline-flex align-items-center gap-1"
                  data-testid="summary-splits-override-toggle"
                >
                  <span>
                    {t("calculator:result.splitsInUnit", {
                      unit: nextAction.label,
                    })}
                  </span>
                  <PencilIcon size={14} />
                </button>
              )}
            </div>
            <div
              data-testid="summary-splits"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${splitsColumnCount}, max-content)`,
                gridTemplateRows: `repeat(${splitsRowsPerColumn}, auto)`,
                gridAutoFlow: "column",
                // Pack columns flush to the left with a fixed gap between
                // them, matching the Times-at-goal-pace section. Was
                // `space-between`, which stretched the columns across the
                // full card width.
                justifyContent: "start",
                columnGap: "1.5rem",
                // Match the other sections at 1rem when the split list is
                // manageable (≤20 rows). Shrink only when the list gets long
                // (marathon-scale) so it still fits inside the card.
                fontSize: splits.rows.length > 20 ? "0.8rem" : "1rem",
                lineHeight: 1.3,
              }}
            >
              {splits.rows.map((split) => (
                <div
                  key={split.splitNumber}
                  data-testid="summary-split-row"
                  className="d-flex"
                  style={{ gap: "0.5rem" }}
                >
                  <span className="text-muted">
                    {formatSplitLabel(split.distance, split.splitNumber)}
                  </span>
                  <span style={valueStyle}>
                    {formatTime({
                      time: split.time,
                      alwaysShowHours: splits.unit !== DistanceUnit.Meters,
                      showHundredths: splits.showHundredths,
                    })}
                  </span>
                </div>
              ))}
            </div>
            {splits.trackSummary && (
              <div
                className="text-muted mt-1"
                style={{ fontSize: "0.75rem", lineHeight: 1.3 }}
                data-testid="summary-track-summary"
              >
                {splits.trackSummary.opening !== null &&
                splits.trackSummary.openingTime !== null
                  ? t("result.trackSummary", {
                      opening: splits.trackSummary.opening,
                      openingTime: formatNaturalDuration(
                        splits.trackSummary.openingTime,
                        t("timeUnit.seconds"),
                      ),
                      lap: splits.trackSummary.lap,
                      lapTime: formatNaturalDuration(
                        splits.trackSummary.lapTime,
                        t("timeUnit.seconds"),
                      ),
                    })
                  : t("result.trackSummaryLapsOnly", {
                      lap: splits.trackSummary.lap,
                      lapTime: formatNaturalDuration(
                        splits.trackSummary.lapTime,
                        t("timeUnit.seconds"),
                      ),
                    })}
              </div>
            )}
          </>
        )}
      </div>
      {toast && (
        <CopyToast
          message={toast.message}
          url={toast.url}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default SummaryView;
