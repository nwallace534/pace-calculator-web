import useCalculatorStore from "@/state/useCalculatorStore";
import { DistanceUnitShortLabel, formatDistanceValue } from "@/utils/distances";
import { getDecimalValue, getNumericValue } from "@/utils/input";
import { eventDistancesInMeters } from "@/utils/events";
import { formatTime } from "@/utils/formatTime";
import { DistanceMode } from "@/types/distance";
import { useTranslation } from "react-i18next";
import { getDistanceInAllUnits, Time } from "pace-calculator";

type TimesForPaceRow = {
  id: string;
  label: string;
  time: Time;
  highlight: boolean;
};

// Absorbs float drift from unit conversion only — not user "near" matches.
const DISTANCE_MATCH_TOLERANCE_METERS = 0.5;

function TimesForPace({ results }: { results: Record<string, Time> | null }) {
  const { t } = useTranslation("events");
  const event = useCalculatorStore((state) => state.event);
  const distanceWhole = useCalculatorStore((state) => state.distanceWhole);
  const distanceFractional = useCalculatorStore(
    (state) => state.distanceFractional,
  );
  const distanceUnit = useCalculatorStore((state) => state.distanceUnit);
  const timeHours = useCalculatorStore((state) => state.timeHours);
  const timeMinutes = useCalculatorStore((state) => state.timeMinutes);
  const timeSeconds = useCalculatorStore((state) => state.timeSeconds);
  const timeHundredths = useCalculatorStore((state) => state.timeHundredths);

  // Custom mode: if the entered distance matches a built-in event, highlight
  // that row; otherwise inject a custom row at its sorted position.
  let customRow: TimesForPaceRow | null = null;
  let customMeters = 0;
  let highlightId: string = event;

  const isCustomMode =
    event === DistanceMode.Custom || event === DistanceMode.CustomTrack;

  if (isCustomMode) {
    const customDistanceValue =
      getNumericValue(distanceWhole) + getDecimalValue(distanceFractional);
    const meters = getDistanceInAllUnits({
      distanceValue: customDistanceValue,
      distanceUnit,
    }).inMeters.distanceValue;

    const matchedEventId = Object.entries(eventDistancesInMeters).find(
      ([, m]) => Math.abs(m - meters) < DISTANCE_MATCH_TOLERANCE_METERS,
    )?.[0];

    if (matchedEventId) {
      highlightId = matchedEventId;
    } else {
      customMeters = meters;
      const unitLabel = DistanceUnitShortLabel[distanceUnit];
      customRow = {
        id: event,
        label: `${formatDistanceValue(customDistanceValue)}${unitLabel}`,
        time: {
          hours: getNumericValue(timeHours),
          minutes: getNumericValue(timeMinutes),
          seconds: getNumericValue(timeSeconds),
          // hundredths field is centiseconds → ×10 for library ms.
          milliseconds: getNumericValue(timeHundredths) * 10,
        },
        highlight: true,
      };
    }
  }

  const rows: TimesForPaceRow[] = [];
  if (results) {
    let inserted = false;
    for (const [id, time] of Object.entries(results)) {
      if (customRow && !inserted && eventDistancesInMeters[id] > customMeters) {
        rows.push(customRow);
        inserted = true;
      }
      rows.push({
        id,
        label: t(`event.${id}.label`),
        time,
        highlight: id === highlightId,
      });
    }
    if (customRow && !inserted) {
      rows.push(customRow);
    }
  }

  return (
    // Padding reserves room for the absolute-positioned selected-row marker
    // so labels stay aligned across rows.
    <div style={{ paddingLeft: "0.25rem" }}>
      <table className="align-middle mt-2 w-100">
        <thead>
          <tr>
            <th className="w-50">{t("calculator:result.columnDistance")}</th>
            <th className="w-50">{t("calculator:result.columnTime")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.highlight ? "fw-bold" : undefined}>
              <td style={{ position: "relative" }}>
                {row.highlight && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      right: "100%",
                      top: "50%",
                      transform: "translateY(-50%)",
                      marginRight: "0.1rem",
                      lineHeight: 1,
                    }}
                  >
                    •
                  </span>
                )}
                {row.label}
              </td>
              <td className="output fs-6">
                {formatTime({ time: row.time, alwaysShowHours: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TimesForPace;
