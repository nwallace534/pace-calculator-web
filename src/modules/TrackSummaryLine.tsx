import type { HTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import type { SplitsResult } from "@/utils/calculator";
import { formatNaturalDuration } from "@/utils/formatTime";

type TrackSummary = NonNullable<SplitsResult["trackSummary"]>;

// opening=null collapses to the laps-only variant (e.g. the mile).
export function TrackSummaryLine({
  trackSummary,
  ...divProps
}: {
  trackSummary: TrackSummary;
} & HTMLAttributes<HTMLDivElement>) {
  const { t } = useTranslation("calculator");
  const secondsLabel = t("timeUnit.seconds");

  const text =
    trackSummary.opening !== null && trackSummary.openingTime !== null
      ? t("result.trackSummary", {
          opening: trackSummary.opening,
          openingTime: formatNaturalDuration(
            trackSummary.openingTime,
            secondsLabel,
          ),
          lap: trackSummary.lap,
          lapTime: formatNaturalDuration(trackSummary.lapTime, secondsLabel),
        })
      : t("result.trackSummaryLapsOnly", {
          lap: trackSummary.lap,
          lapTime: formatNaturalDuration(trackSummary.lapTime, secondsLabel),
        });

  return <div {...divProps}>{text}</div>;
}
