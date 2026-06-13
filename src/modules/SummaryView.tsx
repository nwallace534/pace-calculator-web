import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Time } from "pace-calculator";
import useCalculatorStore from "@/state/useCalculatorStore";
import { getNumericValue } from "@/utils/input";
import { getVisibleTimeFields } from "@/utils/events";
import { buildShareUrl } from "@/utils/shareTarget";
import {
  buildIntervalRows,
  buildSummaryPredictionRows,
  formatFriendlyTimeExact,
} from "@/modules/summaryRows";
import {
  buildDistanceLine,
  getEventLabelText,
  getSplitsColumnCount,
  getSplitsUnitKey,
} from "@/modules/summaryFormat";
import { useAutoHideChrome } from "@/hooks/useAutoHideChrome";
import { useCardCloseAnimation } from "@/hooks/useCardCloseAnimation";
import { TITLE_MAX_LENGTH, useEditableTitle } from "@/hooks/useEditableTitle";
import { useSplitsOverride } from "@/hooks/useSplitsOverride";
import { CloseButton, SectionSpacer } from "@/modules/summaryView/icons";
import { CopyToast } from "@/modules/summaryView/CopyToast";
import { SummaryChrome } from "@/modules/summaryView/SummaryChrome";
import { SummaryHeader } from "@/modules/summaryView/SummaryHeader";
import { SummaryPaces } from "@/modules/summaryView/SummaryPaces";
import { SummaryPredictions } from "@/modules/summaryView/SummaryPredictions";
import { SummaryIntervals } from "@/modules/summaryView/SummaryIntervals";
import { SummarySplits } from "@/modules/summaryView/SummarySplits";

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
  // load, hold for 3s, fade out. Any tap restarts the cycle.
  const chrome = useAutoHideChrome({ hideDelayMs: 3000 });

  // Editable title — ephemeral; closing the card discards the edit.
  const title = useEditableTitle({ maxLength: TITLE_MAX_LENGTH });

  // While `closing` is true the card swaps its flip-in animation for the
  // reverse. The actual unmount fires from onAnimationEnd so the animation
  // has time to finish.
  const close = useCardCloseAnimation(closeSummaryView);

  // Local splits-display override. Closing the card discards the choice.
  const splitsControl = useSplitsOverride({
    storeSplits,
    distanceWhole,
    distanceFractional,
    distanceUnit,
    timeHours,
    timeMinutes,
    timeSeconds,
    timeHundredths,
  });

  const handleRevealControls = () => {
    // While editing, the controls are pinned visible and shouldn't reset
    // the hide timer — let the edit/save action drive visibility instead.
    if (title.editing) return;
    chrome.reveal();
  };

  const handleStartEdit = () => {
    title.startEdit();
    // Pin controls open for the duration of the edit; finishEdit will trigger
    // the fade.
    chrome.pinOpen();
  };

  const handleFinishEdit = () => {
    title.finishEdit();
    // Per spec: finishing the edit fades all controls immediately.
    chrome.fadeNow();
  };

  // Shared opacity/pointer-events transition so all chrome fades as one.
  const controlsFadeStyle: CSSProperties = {
    opacity: chrome.visible ? 1 : 0,
    pointerEvents: chrome.visible ? "auto" : "none",
    transition: "opacity 500ms ease",
  };

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

  // Sprints / track / custom-track events stash precision in hundredths;
  // surface that in every friendly-time render (goal title, predictions,
  // intervals) so a 9.58 100m doesn't read as a flat "9s".
  const { showHundredths } = getVisibleTimeFields(event);
  const goalTime: Time = {
    hours: getNumericValue(timeHours),
    minutes: getNumericValue(timeMinutes),
    seconds: getNumericValue(timeSeconds),
    milliseconds: getNumericValue(timeHundredths) * 10,
  };
  const friendlyGoalTime = formatFriendlyTimeExact(goalTime, showHundredths);

  const eventLabel = getEventLabelText({
    event,
    distanceWhole,
    distanceFractional,
    distanceUnit,
    eventLabel: t(`events:event.${event}.label`, { defaultValue: "" }),
  });

  const distanceLine = buildDistanceLine({
    distanceWhole,
    distanceFractional,
    distanceUnit,
  });

  // Merged splits (override if set, otherwise store) and the toggle action
  // are owned by useSplitsOverride.
  const splits = splitsControl.splits;
  const nextAction = splitsControl.nextAction;

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

  const splitsColumnCount = getSplitsColumnCount(splits?.rows.length ?? 0);
  // CSS Grid with explicit row count + column-flow so each split row is
  // strictly contained in its grid cell — no chance of leaking into the next
  // column the way CSS multi-column was doing. Trades perfect time alignment
  // for guaranteed-no-overlap, which the user explicitly preferred.
  const splitsRowsPerColumn = Math.ceil(
    (splits?.rows.length ?? 0) / Math.max(1, splitsColumnCount),
  );

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
        if (title.editing) {
          handleFinishEdit();
          return;
        }
        handleRevealControls();
      }}
      onMouseMove={handleRevealControls}
    >
      <SummaryChrome
        fadeStyle={controlsFadeStyle}
        arrivedFromShare={arrivedFromShare}
        onCopy={handleCopy}
        onClose={close.triggerClose}
      />

      <div
        className={`card rounded-3 border-0 p-3 mx-auto position-relative d-flex flex-column ${
          close.closing ? "summary-card-flip-out" : "summary-card-flip-in"
        }`}
        onAnimationEnd={close.handleAnimationEnd}
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
        <SummaryHeader
          title={title}
          chromeVisible={chrome.visible}
          eventLabel={eventLabel}
          friendlyGoalTime={friendlyGoalTime}
          distanceLine={distanceLine}
          titleMaxLength={TITLE_MAX_LENGTH}
          onStartEdit={handleStartEdit}
          onFinishEdit={handleFinishEdit}
        />

        <SectionSpacer />

        <SummaryPaces paceResults={paceResults} />

        {predictionRows.length > 0 && (
          <>
            <SectionSpacer />
            <SummaryPredictions
              rows={predictionRows}
              showHundredths={showHundredths}
            />
          </>
        )}

        {intervalRows.length > 0 && (
          <>
            <SectionSpacer />
            <SummaryIntervals
              rows={intervalRows}
              showHundredths={showHundredths}
            />
          </>
        )}

        {splits && splits.rows.length > 0 && (
          <>
            <SectionSpacer />
            <SummarySplits
              splits={splits}
              splitsColumnCount={splitsColumnCount}
              splitsRowsPerColumn={splitsRowsPerColumn}
              splitsHeadingUnit={splitsHeadingUnit}
              chromeVisible={chrome.visible}
              nextAction={nextAction}
              onOverride={splitsControl.setOverride}
            />
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
