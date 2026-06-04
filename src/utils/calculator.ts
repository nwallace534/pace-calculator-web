import {
  calculatePace,
  calculateSplits,
  CalculateSplitsOutput,
  DistanceInAllUnits,
  DistanceUnit,
  getDistanceInAllUnits,
  getTimesForPace,
  MultiPace,
  Time,
} from "pace-calculator";
import { hasTimeValue } from "./validator";
import {
  eventDistancesInMeters,
  getEventLandmarks,
  getVisibleTimeFields,
  imperialEventsForPace,
  metricEventsForPace,
} from "./events";
import { getDecimalValue, getNumericValue } from "./input";
import { msToTime, timeToMs } from "./time";
import {
  CalculatorInputSubset,
  DistanceInputSubset,
} from "@/types/calculatorInput";

export enum ComputeMode {
  Distance = "Distance",
  Time = "Time",
  Pace = "Pace",
}

// Everything the splits view needs, pre-resolved so the component can render
// without re-deriving event/unit/precision rules.
export type SplitsResult = {
  unit: DistanceUnit;
  showHundredths: boolean;
  rows: CalculateSplitsOutput;
  trackSummary: {
    opening: number;
    openingTime: Time;
    lap: number;
    lapTime: Time;
  } | null;
};

export const getCalculationUpdate = (state: CalculatorInputSubset) => {
  let paceResults: MultiPace | null = null;
  let splits: SplitsResult | null = null;
  let timesForPace: Record<string, Time> | null = null;

  if (state.computeMode === ComputeMode.Pace) {
    const {
      distanceWhole,
      distanceFractional,
      distanceUnit,
      timeHours,
      timeMinutes,
      timeSeconds,
      timeHundredths,
    } = state;

    const distance = {
      distanceValue:
        getNumericValue(distanceWhole) + getDecimalValue(distanceFractional),
      distanceUnit: distanceUnit,
    };

    const time = {
      hours: getNumericValue(timeHours),
      minutes: getNumericValue(timeMinutes),
      seconds: getNumericValue(timeSeconds),
      // Library works in true ms; our field is hundredths, so scale by 10.
      milliseconds: getNumericValue(timeHundredths) * 10,
    };

    if (hasTimeValue(time) && distance.distanceValue > 0) {
      paceResults = calculatePace({
        distance,
        time,
      });

      if (state.showSplits) {
        const distanceInAllUnits = getDistanceInAllUnits(distance);
        const totalMeters = distanceInAllUnits.inMeters.distanceValue;
        const trackLandmarks = getEventLandmarks(state.event, totalMeters);

        const splitsUnit = trackLandmarks
          ? DistanceUnit.Meters
          : (state.splitsUnit ?? distanceUnit);

        let rows: CalculateSplitsOutput;
        if (trackLandmarks) {
          // Library only handles uniform intervals — scale each materialised
          // landmark by proportion of the total instead.
          const totalMs = timeToMs(time);
          rows = trackLandmarks.map((landmark, i) => ({
            splitNumber: i + 1,
            distance: landmark,
            time: msToTime((totalMs * landmark) / totalMeters),
          }));
        } else {
          // Road branch: splitsUnit is always Km or Miles here. Custom (road)
          // forbids Meters in its distance dropdown, and every meter-distance
          // event routes through trackLandmarks above.
          const splitsDistance =
            splitsUnit === DistanceUnit.Miles
              ? distanceInAllUnits.inMiles
              : distanceInAllUnits.inKilometers;

          rows = calculateSplits({
            time,
            distance: splitsDistance,
            splitInterval: 1,
          });
        }

        const showHundredths = getVisibleTimeFields(state.event).showHundredths;

        // Surface "first X in Y, then Z-meter laps in W" when there's a
        // non-uniform opener (first landmark shorter than subsequent ones).
        // Uniform-lap events (800m, sprints) leave trackSummary null.
        const trackSummary =
          trackLandmarks && rows.length >= 2
            ? (() => {
                const opening = trackLandmarks[0];
                const lap = trackLandmarks[1] - trackLandmarks[0];
                if (opening === lap) return null;
                return {
                  opening,
                  openingTime: rows[0].time,
                  lap,
                  lapTime: msToTime(
                    timeToMs(rows[1].time) - timeToMs(rows[0].time),
                  ),
                };
              })()
            : null;

        splits = { unit: splitsUnit, showHundredths, rows, trackSummary };
      }

      if (state.showTimesForPace) {
        const kPace = {
          minutes: paceResults.perKilometer.minutes,
          seconds: paceResults.perKilometer.seconds,
          milliseconds: paceResults.perKilometer.milliseconds,
          unit: DistanceUnit.Kilometers,
        };

        const mPace = {
          minutes: paceResults.perMile.minutes,
          seconds: paceResults.perMile.seconds,
          milliseconds: paceResults.perMile.milliseconds,
          unit: DistanceUnit.Miles,
        };

        const kTimesForPace = getTimesForPace({
          pace: kPace,
          distances: metricEventsForPace,
        });

        const mTimesForPace = getTimesForPace({
          pace: mPace,
          distances: imperialEventsForPace,
        });

        // Sort by actual distance so the mile (1609m) sits between 1500m and
        // 3K, instead of after 10K just because it was paced in miles.
        const merged = { ...kTimesForPace, ...mTimesForPace };
        timesForPace = Object.fromEntries(
          Object.entries(merged).sort(
            ([a], [b]) => eventDistancesInMeters[a] - eventDistancesInMeters[b],
          ),
        );
      }
    }
  }

  return {
    paceResults,
    timesForPace,
    splits,
  };
};

export const getDistanceConversionUpdates = (state: DistanceInputSubset) => {
  const { distanceWhole, distanceFractional, distanceUnit } = state;

  const distance = {
    distanceValue:
      getNumericValue(distanceWhole) + getDecimalValue(distanceFractional),
    distanceUnit: distanceUnit,
  };

  const allDistances: DistanceInAllUnits = getDistanceInAllUnits(distance);

  return {
    allDistances,
  };
};
