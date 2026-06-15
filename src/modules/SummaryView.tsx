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
  getSplitsUnitKey,
} from "@/modules/summaryFormat";
import { useAutoHideControls } from "@/hooks/useAutoHideControls";
import { useCardCloseAnimation } from "@/hooks/useCardCloseAnimation";
import { TITLE_MAX_LENGTH, useEditableTitle } from "@/hooks/useEditableTitle";
import { useSplitsOverride } from "@/hooks/useSplitsOverride";
import { CloseButton, SectionSpacer } from "@/modules/summaryView/icons";
import { CopyToast } from "@/modules/summaryView/CopyToast";
import { SummaryControls } from "@/modules/summaryView/SummaryControls";
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

  // The body reads via getState() so eslint flags the deps as unused, but
  // they still trigger the recompute on input edits.
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

  const controls = useAutoHideControls({ hideDelayMs: 3000 });
  const title = useEditableTitle({ maxLength: TITLE_MAX_LENGTH });
  const close = useCardCloseAnimation(closeSummaryView);
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

  // Reveal during editing would let the hide timer race the save.
  const handleRevealControls = () => {
    if (title.editing) return;
    controls.reveal();
  };

  const handleStartEdit = () => {
    title.startEdit();
    controls.pinOpen();
  };

  const handleFinishEdit = () => {
    title.finishEdit();
    controls.fadeNow();
  };

  const controlsFadeStyle: CSSProperties = {
    opacity: controls.visible ? 1 : 0,
    pointerEvents: controls.visible ? "auto" : "none",
    transition: "opacity 500ms ease",
  };

  if (!paceResults) {
    // A share-link load can clear the distance — bail rather than render half a card.
    return (
      <div className="container py-3 d-flex justify-content-end">
        <CloseButton
          onClick={closeSummaryView}
          ariaLabel={t("calculator:summary.close")}
        />
      </div>
    );
  }

  // Sprint / track / custom-track events carry sub-second precision so a 9.58 100m doesn't read as "9s".
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

  return (
    <div
      className="px-3 summary-view"
      data-testid="summary-view"
      onClick={() => {
        // Bubbled clicks commit the edit; the input + check button stopPropagation so this only fires for taps outside.
        if (title.editing) {
          handleFinishEdit();
          return;
        }
        handleRevealControls();
      }}
      onMouseMove={handleRevealControls}
    >
      <SummaryControls
        fadeStyle={controlsFadeStyle}
        arrivedFromShare={arrivedFromShare}
        onCopy={handleCopy}
        onClose={close.triggerClose}
      />

      <div
        className={`card rounded-3 border-0 p-3 mx-auto position-relative d-flex flex-column summary-card ${
          close.closing ? "summary-card-flip-out" : "summary-card-flip-in"
        }`}
        onAnimationEnd={close.handleAnimationEnd}
        data-testid="summary-card"
      >
        <SummaryHeader
          title={title}
          controlsVisible={controls.visible}
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
              splitsHeadingUnit={splitsHeadingUnit}
              controlsVisible={controls.visible}
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
