import { ExpandableCard } from "@/components/ExpandableCard";
import useCalculatorStore from "@/state/useCalculatorStore";
import TimesForPace from "@/modules/TimesForPace";
import PaceSplits from "@/modules/PaceSplits";
import {
  formatDistanceValue,
  getDistanceUnitSingular,
} from "@/utils/distances";
import { getDecimalValue, getNumericValue } from "@/utils/input";
import { formatTime } from "@/utils/formatTime";
import { useTranslation } from "react-i18next";
import { DistanceUnit, MultiPace } from "pace-calculator";

function PaceResult() {
  const { t } = useTranslation("calculator");
  const paceResults = useCalculatorStore((state) => state.paceResults);
  const timesForPace = useCalculatorStore((state) => state.timesForPace);
  const splits = useCalculatorStore((state) => state.splits);
  const showSplits = useCalculatorStore((state) => state.showSplits);
  const setShowSplits = useCalculatorStore((state) => state.setShowSplits);
  const showTimesForPace = useCalculatorStore(
    (state) => state.showTimesForPace,
  );
  const setShowTimesForPace = useCalculatorStore(
    (state) => state.setShowTimesForPace,
  );

  if (!paceResults) return null;

  return (
    <div className="row">
      <div className="col-md-6"></div>

      <div className="col-md-6">
        <PaceSummary results={paceResults} />

        <ExpandableCard
          title={t("result.timesForPace")}
          testId="card-times-for-pace"
          isExpanded={showTimesForPace}
          handleToggle={setShowTimesForPace}
        >
          <TimesForPace results={timesForPace} />
        </ExpandableCard>

        <ExpandableCard
          title={t("result.splits")}
          testId="card-splits"
          isExpanded={showSplits}
          handleToggle={setShowSplits}
        >
          <PaceSplits splits={splits} />
        </ExpandableCard>
      </div>
    </div>
  );
}

function PaceSummary({ results }: { results: MultiPace }) {
  const { t } = useTranslation("calculator");
  const distance = useCalculatorStore((state) => state.distanceWhole);
  const distanceDecimal = useCalculatorStore(
    (state) => state.distanceFractional,
  );
  const distanceUnit = useCalculatorStore((state) => state.distanceUnit);

  const allDistances = useCalculatorStore((state) => state.allDistances);

  const displayText = (() => {
    if (!allDistances) return "";

    // Round the entered distance the same way as the converted one, so both
    // sides of the approximation show at most one decimal place.
    const enteredDistance = formatDistanceValue(
      getNumericValue(distance) + getDecimalValue(distanceDecimal),
    );

    switch (distanceUnit) {
      case DistanceUnit.Miles:
        return t("distanceApproximation", {
          from: `${enteredDistance} ${distanceUnit}`,
          to: `${formatDistanceValue(
            allDistances.inKilometers.distanceValue,
          )}${getDistanceUnitSingular(DistanceUnit.Kilometers)}`,
        });
      case DistanceUnit.Meters:
      case DistanceUnit.Kilometers:
        return t("distanceApproximation", {
          from: `${enteredDistance}${getDistanceUnitSingular(distanceUnit)}`,
          to: `${formatDistanceValue(allDistances.inMiles.distanceValue)} ${
            DistanceUnit.Miles
          }`,
        });
      default:
        return "";
    }
  })();

  return (
    <div
      className="card rounded-3 border-0 p-3 mb-3"
      style={{
        backgroundColor: "var(--bs-secondary-bg)",
        color: "var(--bs-body-color)",
      }}
    >
      <div className="row row-cols-2 g-2">
        <div className="col">
          <div className="label">{t("result.pacePerKm")}</div>
          <output className="output">
            {formatTime({ time: results.perKilometer })} {t("unit.perKm")}
          </output>
        </div>

        <div className="col">
          <div className="label">{t("result.pacePerMile")}</div>
          <output className="output">
            {formatTime({ time: results.perMile })} {t("unit.perMile")}
          </output>
        </div>

        <div className="w-100">
          <hr className="my-0" />
        </div>

        <div className="col">
          <div className="label">{t("result.speedKph")}</div>
          <output className="output ">
            {results.speedKph.toFixed(1)} {t("unit.kph")}
          </output>
        </div>

        <div className="col">
          <div className="label">{t("result.speedMph")}</div>
          <output className="output ">
            {results.speedMph.toFixed(1)} {t("unit.mph")}
          </output>
        </div>
      </div>

      {allDistances && (
        <div className="col mt-2 text-muted text-smallish">{displayText}</div>
      )}
    </div>
  );
}

export default PaceResult;
