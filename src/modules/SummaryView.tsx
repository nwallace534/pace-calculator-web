import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useCalculatorStore from "@/state/useCalculatorStore";
import { getSplitsUnitKey } from "@/modules/summaryFormat";
import { buildShareUrl } from "@/utils/shareTarget";
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
  const friendlyGoalTime = useCalculatorStore((s) => s.friendlyGoalTime);
  const distanceLine = useCalculatorStore((s) => s.distanceLine);
  const customDistanceLabel = useCalculatorStore((s) => s.customDistanceLabel);
  const predictionRows = useCalculatorStore((s) => s.predictionRows);
  const intervalRows = useCalculatorStore((s) => s.intervalRows);
  const arrivedFromShare = useCalculatorStore((s) => s.summaryArrivedFromShare);

  // paceResults changes ref on every input edit, so it's a sufficient invalidation key.
  const shareUrl = useMemo(() => {
    return buildShareUrl(useCalculatorStore.getState(), window.location, {
      view: "summary",
      fromShare: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paceResults]);

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
  const splitsControl = useSplitsOverride();

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

  const eventLabel =
    customDistanceLabel ??
    t(`events:event.${event}.label`, { defaultValue: "" });

  const splits = splitsControl.splits;
  const nextAction = splitsControl.nextAction;

  // Unit-key reflects the effective splits (override or store), not the store value.
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
          friendlyGoalTime={friendlyGoalTime ?? ""}
          distanceLine={distanceLine ?? ""}
          titleMaxLength={TITLE_MAX_LENGTH}
          onStartEdit={handleStartEdit}
          onFinishEdit={handleFinishEdit}
        />

        <SectionSpacer />

        <SummaryPaces paceResults={paceResults} />

        {predictionRows.length > 0 && (
          <>
            <SectionSpacer />
            <SummaryPredictions rows={predictionRows} />
          </>
        )}

        {intervalRows.length > 0 && (
          <>
            <SectionSpacer />
            <SummaryIntervals rows={intervalRows} />
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
