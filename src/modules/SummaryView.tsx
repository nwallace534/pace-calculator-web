import { useTranslation } from "react-i18next";
import { DistanceUnit } from "pace-calculator";
import useCalculatorStore from "@/state/useCalculatorStore";
import { formatTime } from "@/utils/formatTime";
import { DistanceMode } from "@/types/distance";
import IconRunner from "@/assets/icon-runner.svg?react";
import IconSpeedometer from "@/assets/icon-speedometer.svg?react";
import { DistanceUnitShortLabel, formatDistanceValue } from "@/utils/distances";
import { getDecimalValue, getNumericValue } from "@/utils/input";
import { getVisibleTimeFields, Events } from "@/utils/events";
import { timeStringsToMs } from "@/utils/time";
import {
  buildIntervalRows,
  buildSummaryPredictionRows,
} from "@/modules/summaryRows";

// World-record entries get descriptive labels (e.g. "12:35.36 Cheptegei '20
// (M WR) 🏆") that don't read as a personal goal — exclude them from the
// match so the card never claims the user's goal IS the WR.
const EXCLUDED_EXAMPLE_IDS = new Set(["fWR", "mWR"]);

const findMatchingTimeExampleId = (
  eventId: string,
  goalMs: number,
): string | null => {
  const event = Events.find((e) => e.id === eventId);
  const match = event?.eventGuide?.timeExamples.find(
    (ex) =>
      !EXCLUDED_EXAMPLE_IDS.has(ex.id) && timeStringsToMs(ex.time) === goalMs,
  );
  return match?.id ?? null;
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

function BackButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="summary-back"
      className="btn btn-sm btn-outline-secondary position-absolute"
      style={{ top: "0.75rem", left: "0.75rem", zIndex: 10, opacity: 0.85 }}
    >
      ← {label}
    </button>
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
  const splits = useCalculatorStore((s) => s.splits);
  const distanceWhole = useCalculatorStore((s) => s.distanceWhole);
  const distanceFractional = useCalculatorStore((s) => s.distanceFractional);
  const distanceUnit = useCalculatorStore((s) => s.distanceUnit);
  const timeHours = useCalculatorStore((s) => s.timeHours);
  const timeMinutes = useCalculatorStore((s) => s.timeMinutes);
  const timeSeconds = useCalculatorStore((s) => s.timeSeconds);
  const timeHundredths = useCalculatorStore((s) => s.timeHundredths);

  if (!paceResults) {
    // Defensive: the entry button is only rendered alongside paceResults, but
    // if state changes (e.g. distance cleared via share-link load), bail out
    // gracefully back to the calculator.
    return (
      <div className="container py-3">
        <BackButton
          onClick={closeSummaryView}
          label={t("calculator:summary.back")}
        />
      </div>
    );
  }

  const { showHours, showHundredths } = getVisibleTimeFields(event);
  const goalTime = formatTime({
    time: {
      hours: getNumericValue(timeHours),
      minutes: getNumericValue(timeMinutes),
      seconds: getNumericValue(timeSeconds),
      milliseconds: getNumericValue(timeHundredths) * 10,
    },
    alwaysShowHours: showHours,
    showHundredths,
  });

  const eventLabel = getEventLabelText({
    event,
    distanceWhole,
    distanceFractional,
    distanceUnit,
    eventLabel: t(`events:event.${event}.label`, { defaultValue: "" }),
  });

  // Prefer the catalogued goal label (e.g. "Sub 30 mins ⚡") when the entered
  // time matches a non-WR example exactly; otherwise show a friendly fallback
  // like "A 5K in 24:30".
  const goalMs = timeStringsToMs({
    timeHours,
    timeMinutes,
    timeSeconds,
    timeHundredths,
  });
  const matchingExampleId = findMatchingTimeExampleId(event, goalMs);
  const headingText = matchingExampleId
    ? t("calculator:summary.goalMatched", {
        event: eventLabel,
        label: t(`events:event.${event}.${matchingExampleId}.label`),
      })
    : t("calculator:summary.goalFallback", {
        event: eventLabel,
        time: goalTime,
      });

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
  // Cap the splits container at the natural width of its columns + gaps so
  // columns stay left-stacked instead of spreading across the full card.
  const SPLITS_COLUMN_REM = 5.5;
  const SPLITS_GAP_REM = 0.75;
  const splitsMaxWidth = `${
    splitsColumnCount * SPLITS_COLUMN_REM +
    Math.max(splitsColumnCount - 1, 0) * SPLITS_GAP_REM
  }rem`;

  // Content density → font scale. 5K leaves the card half-empty so we scale
  // up; marathon already fills it so we leave it alone. Splits row count is
  // the dominant lever (5 for 5K, ~26 for marathon).
  const splitsRowCount = splits?.rows.length ?? 5;
  const summaryScale = Math.max(
    0.95,
    Math.min(1.45, 1.45 - (splitsRowCount - 5) * 0.024),
  );

  return (
    <div
      className="container py-4"
      style={{ position: "relative", minHeight: "100vh" }}
      data-testid="summary-view"
    >
      <BackButton
        onClick={closeSummaryView}
        label={t("calculator:summary.back")}
      />

      <div
        className="card rounded-3 border-0 p-3 mt-5 mx-auto position-relative"
        style={{
          backgroundColor: "var(--bs-secondary-bg)",
          color: "var(--bs-body-color)",
          // Cap at roughly the widest portrait phone (~448px) so the card stays
          // a phone-sized screenshot target on tablets/desktops while still
          // shrinking on narrower devices.
          maxWidth: "28rem",
        }}
        data-testid="summary-card"
      >
        <div
          className="position-absolute text-center"
          style={{ top: "0.75rem", right: "0.75rem", lineHeight: 1.1 }}
          data-testid="summary-branding"
        >
          <img
            src="/pacerly-logo-teal.svg"
            alt="Pacerly"
            width="54"
            height="54"
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

        <div className="mb-3">
          <div
            className="text-muted"
            style={{
              fontWeight: 600,
              fontSize: `${summaryScale * 0.85}rem`,
              lineHeight: 1.1,
              letterSpacing: "0.02em",
            }}
          >
            {t("calculator:summary.goalHeading")}
          </div>
          <output
            className="d-block"
            style={{
              color: "var(--accent)",
              fontSize: `${summaryScale * 1.1}rem`,
              lineHeight: 1.3,
              marginTop: "0.15rem",
            }}
          >
            {headingText}
          </output>
        </div>

        <hr className="my-2" />

        <div className="d-flex align-items-center gap-3 mb-2">
          <IconRunner
            style={{
              width: "1.75rem",
              height: "1.75rem",
              flexShrink: 0,
              color: "var(--accent)",
            }}
          />
          <div className="d-flex flex-grow-1 gap-3">
            <div className="flex-grow-1">
              <div className="label">{t("calculator:result.pacePerKm")}</div>
              <output className="output">
                {formatTime({ time: paceResults.perKilometer })}{" "}
                {t("calculator:unit.perKm")}
              </output>
            </div>
            <div className="flex-grow-1">
              <div className="label">{t("calculator:result.pacePerMile")}</div>
              <output className="output">
                {formatTime({ time: paceResults.perMile })}{" "}
                {t("calculator:unit.perMile")}
              </output>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <IconSpeedometer
            style={{
              width: "1.75rem",
              height: "1.75rem",
              flexShrink: 0,
              color: "var(--accent)",
            }}
          />
          <div className="d-flex flex-grow-1 gap-3">
            <div className="flex-grow-1">
              <div className="label">{t("calculator:result.speedKph")}</div>
              <output className="output">
                {paceResults.speedKph.toFixed(1)} {t("calculator:unit.kph")}
              </output>
            </div>
            <div className="flex-grow-1">
              <div className="label">{t("calculator:result.speedMph")}</div>
              <output className="output">
                {paceResults.speedMph.toFixed(1)} {t("calculator:unit.mph")}
              </output>
            </div>
          </div>
        </div>

        {predictionRows.length > 0 && (
          <>
            <hr className="my-3" />
            <div
              className="label mb-2 text-muted text-smallish"
              data-testid="summary-predictions-heading"
            >
              {t("calculator:summary.predictionsHeading")}
            </div>
            <ul
              className="list-unstyled mb-0"
              data-testid="summary-predictions"
            >
              {predictionRows.map((row) => (
                <li key={row.id} className="mb-1">
                  {t("calculator:summary.predictionRow", {
                    label: row.label,
                    time: row.friendlyTime,
                  })}
                </li>
              ))}
            </ul>
          </>
        )}

        {intervalRows.length > 0 && (
          <>
            <hr className="my-3" />
            <div className="label mb-2 text-muted text-smallish">
              {t("calculator:summary.intervalsHeading")}
            </div>
            <div
              data-testid="summary-intervals"
              style={{
                // Multi-column for responsive packing, but cap maxWidth at
                // ~2 columns so columns stay left-stacked with empty space on
                // the right instead of stretching across the full card.
                // NB: font-size deliberately not scaled — the em-based label
                // min-width would blow past the column at the 5K scale.
                columnWidth: "12.5rem",
                columnGap: "1rem",
                maxWidth: "26rem",
              }}
            >
              {intervalRows.map((row) => (
                <div
                  key={row.label}
                  data-testid="summary-interval-row"
                  className="d-flex"
                  style={{ gap: "0.5rem", breakInside: "avoid" }}
                >
                  {/* Fixed label box so times line up at the same x position
                      across every row in a column. Sized to fit "Half Marathon",
                      the widest label in the set. */}
                  <span style={{ minWidth: "6.5em" }}>{row.label}</span>
                  <span className="output" style={{ fontSize: "inherit" }}>
                    {formatTime({ time: row.time })}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {splits && splits.rows.length > 0 && (
          <>
            <hr className="my-3" />
            <div className="label mb-2 text-muted text-smallish">
              {t("calculator:summary.splitsHeading", {
                unit: splitsHeadingUnit,
              })}
            </div>
            <div
              data-testid="summary-splits"
              style={{
                columnCount: splitsColumnCount,
                columnGap: `${SPLITS_GAP_REM}rem`,
                maxWidth: splitsMaxWidth,
                // Scale split font with content density. text-small (0.75rem)
                // is the baseline; sparse splits push toward 1.1rem.
                fontSize: `${summaryScale * 0.75}rem`,
              }}
            >
              {splits.rows.map((split) => (
                <div
                  key={split.splitNumber}
                  data-testid="summary-split-row"
                  className="d-flex"
                  style={{ gap: "0.4rem", breakInside: "avoid" }}
                >
                  {/* Fixed label box so times line up at the same x. Sized
                      to fit the widest split label in the set (e.g. "26.22"
                      for marathon miles, "1100" for track meter landmarks). */}
                  <span className="text-muted" style={{ minWidth: "2.75em" }}>
                    {formatSplitLabel(split.distance, split.splitNumber)}
                  </span>
                  <span className="output" style={{ fontSize: "inherit" }}>
                    {formatTime({
                      time: split.time,
                      alwaysShowHours: splits.unit !== DistanceUnit.Meters,
                      showHundredths: splits.showHundredths,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-center text-muted text-small mt-3">
          {t("calculator:summary.hint")}
        </div>
      </div>
    </div>
  );
}

export default SummaryView;
