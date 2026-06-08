import Distance from "./Distance";
import Time from "./Time";
import "../styles/calculator.css";
import PaceResult from "./PaceResult";

function Calculator() {
  return (
    <div className="flow-container mx-auto pb-5">
      <div className="calculator-grid">
        <div className="calculator-col">
          {/* Wrapped in a plain div rather than <form> so browsers and
              password managers don't apply form-context autofill heuristics
              to the time/distance fields. There's no submit here anyway. */}
          <div className="calculator-form">
            <Distance />
            <div className="mt-4">
              <Time />
            </div>
          </div>
        </div>
        <div className="calculator-col calculator-col-right">
          <PaceResult />
        </div>
      </div>
    </div>
  );
}

export default Calculator;
