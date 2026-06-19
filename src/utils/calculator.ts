import {
  calculatePace,
  calculateSplits,
  CalculateSplitsOutput,
  Distance,
  DistanceInAllUnits,
  DistanceUnit,
  getDistanceInAllUnits,
  getTimesForPace,
  MultiPace,
  Time,
} from "pace-calculator";
import { hasTimeValue } from "./validator";
import {
  getDistanceInMetersForId,
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
import {
  buildDistanceLine,
  buildIntervalRows,
  buildSummaryPredictionRows,
  formatFriendlyTimeExact,
  getCustomDistanceLabel,
  type IntervalRow,
  type SummaryPredictionRow,
} from "@/modules/summaryView/summaryData";

export enum ComputeMode {
  Distance = "Distance",
  Time = "Time",
  Pace = "Pace",
}

export type SplitsResult = {
  unit: DistanceUnit;
  showHundredths: boolean;
  rows: CalculateSplitsOutput;
  trackSummary: {
    /** Null for pure-laps (e.g. the mile); the renderer drops the "First Xm in Y · " prefix. */
    opening: number | null;
    openingTime: Time | null;
    lap: number;
    lapTime: Time;
  } | null;
};

export const getCalculationUpdate = (state: CalculatorInputSubset) => {
  let paceResults: MultiPace | null = null;
  let splits: SplitsResult | null = null;
  let timesForPace: Record<string, Time> | null = null;
  let friendlyGoalTime: string | null = null;
  let distanceLine: string | null = null;
  let customDistanceLabel: string | null = null;
  let predictionRows: SummaryPredictionRow[] = [];
  let intervalRows: IntervalRow[] = [];
  let splitsByKilometers: SplitsResult | null = null;
  let splitsByMiles: SplitsResult | null = null;
  let splitsBy100m: SplitsResult | null = null;
  let totalDistanceMeters: number | null = null;

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

      const distanceInAllUnits = getDistanceInAllUnits(distance);
      const totalMeters = distanceInAllUnits.inMeters.distanceValue;
      totalDistanceMeters = totalMeters;

      {
        const trackLandmarks = getEventLandmarks(state.event, totalMeters);

        const primarySplitUnit = trackLandmarks
          ? DistanceUnit.Meters
          : distanceUnit;

        let rows: CalculateSplitsOutput;
        if (trackLandmarks) {
          // pace-calculator only handles uniform intervals, so scale each landmark by proportion of the total.
          const totalMs = timeToMs(time);
          rows = trackLandmarks.map((landmark, i) => ({
            splitNumber: i + 1,
            distance: landmark,
            time: msToTime((totalMs * landmark) / totalMeters),
          }));
        } else {
          // primarySplitUnit is Km or Miles here — meter events route through trackLandmarks above.
          const splitsDistance =
            primarySplitUnit === DistanceUnit.Miles
              ? distanceInAllUnits.inMiles
              : distanceInAllUnits.inKilometers;

          rows = calculateSplits({
            time,
            distance: splitsDistance,
            splitInterval: 1,
          });
        }

        const showHundredths = getVisibleTimeFields(state.event).showHundredths;

        // Three shapes: opener + laps (1500m), laps-only with trailing partial (mile), or null (clean uniform / sub-400m).
        const trackSummary =
          trackLandmarks && rows.length >= 2 && totalMeters >= 400
            ? (() => {
                const opening = trackLandmarks[0];
                const lap = trackLandmarks[1] - trackLandmarks[0];
                const lastGap =
                  trackLandmarks[trackLandmarks.length - 1] -
                  trackLandmarks[trackLandmarks.length - 2];
                const hasOpener = opening !== lap;
                const hasTrailing = lastGap !== lap;
                if (!hasOpener && !hasTrailing) return null;
                const lapTime = msToTime(
                  timeToMs(rows[1].time) - timeToMs(rows[0].time),
                );
                if (!hasOpener) {
                  return {
                    opening: null,
                    openingTime: null,
                    lap,
                    lapTime,
                  };
                }
                return {
                  opening,
                  openingTime: rows[0].time,
                  lap,
                  lapTime,
                };
              })()
            : null;

        splits = { unit: primarySplitUnit, showHundredths, rows, trackSummary };
      }

      {
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

        // Partition saved customs by pace unit. Kilometers and Meters both pace
        // per-km; Miles paces per-mile.
        const savedMetric: Record<string, Distance> = {};
        const savedImperial: Record<string, Distance> = {};
        for (const s of state.savedDistances) {
          const distance: Distance = {
            distanceValue: s.distanceValue,
            distanceUnit: s.distanceUnit,
          };
          if (s.distanceUnit === DistanceUnit.Miles) {
            savedImperial[`saved:${s.id}`] = distance;
          } else {
            savedMetric[`saved:${s.id}`] = distance;
          }
        }

        const kTimesForPace = getTimesForPace({
          pace: kPace,
          distances: { ...metricEventsForPace, ...savedMetric },
        });

        const mTimesForPace = getTimesForPace({
          pace: mPace,
          distances: { ...imperialEventsForPace, ...savedImperial },
        });

        // Sort by actual distance so saved customs (km or miles) slot in by
        // their meters rather than being bucketed by pace unit.
        const merged = { ...kTimesForPace, ...mTimesForPace };
        timesForPace = Object.fromEntries(
          Object.entries(merged).sort(
            ([a], [b]) =>
              getDistanceInMetersForId(a, state.savedDistances) -
              getDistanceInMetersForId(b, state.savedDistances),
          ),
        );
      }

      const showHundredths = getVisibleTimeFields(state.event).showHundredths;
      friendlyGoalTime = formatFriendlyTimeExact(time, showHundredths);
      distanceLine = buildDistanceLine({
        distanceWhole: state.distanceWhole,
        distanceFractional: state.distanceFractional,
        distanceUnit: state.distanceUnit,
      });
      customDistanceLabel = getCustomDistanceLabel({
        event: state.event,
        distanceWhole: state.distanceWhole,
        distanceFractional: state.distanceFractional,
        distanceUnit: state.distanceUnit,
      });
      predictionRows = buildSummaryPredictionRows({
        distanceWhole: state.distanceWhole,
        distanceFractional: state.distanceFractional,
        distanceUnit: state.distanceUnit,
        timeHours: state.timeHours,
        timeMinutes: state.timeMinutes,
        timeSeconds: state.timeSeconds,
        timeHundredths: state.timeHundredths,
        showHundredths,
      });
      intervalRows = buildIntervalRows({
        paceResults,
        distanceWhole: state.distanceWhole,
        distanceFractional: state.distanceFractional,
        distanceUnit: state.distanceUnit,
        showHundredths,
      });

      // Picker variants share the event's showHundredths so sprint precision survives the switch.
      splitsByKilometers = {
        unit: DistanceUnit.Kilometers,
        showHundredths,
        trackSummary: null,
        rows: calculateSplits({
          time,
          distance: distanceInAllUnits.inKilometers,
          splitInterval: 1,
        }),
      };
      splitsByMiles = {
        unit: DistanceUnit.Miles,
        showHundredths,
        trackSummary: null,
        rows: calculateSplits({
          time,
          distance: distanceInAllUnits.inMiles,
          splitInterval: 1,
        }),
      };
      splitsBy100m = {
        unit: DistanceUnit.Meters,
        showHundredths,
        trackSummary: null,
        rows: calculateSplits({
          time,
          distance: distanceInAllUnits.inMeters,
          splitInterval: 100,
        }),
      };
    }
  }

  return {
    paceResults,
    timesForPace,
    splits,
    friendlyGoalTime,
    distanceLine,
    customDistanceLabel,
    predictionRows,
    intervalRows,
    splitsByKilometers,
    splitsByMiles,
    splitsBy100m,
    totalDistanceMeters,
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
