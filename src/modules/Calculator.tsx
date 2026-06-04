import Distance from "./Distance";
import Time from "./Time";
import "../styles/calculator.css";
import PaceResult from "./PaceResult";
import CalculatorHint from "./CalculatorHint";

function Calculator() {
  return (
    <>
      <div className="flow-container mx-auto pb-5">
        <div className="row gy-3">
          <div className="col-12">
            {/* Wrapped in a plain div rather than <form> so browsers and
                password managers don't apply form-context autofill heuristics
                to the time/distance fields. There's no submit here anyway. */}
            <div className="calculator-form">
              <Distance />
              <div className="mt-3">
                <Time />
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 offset-md-6">
            <CalculatorHint />
          </div>

          <div className="col-12">
            <PaceResult />
          </div>
        </div>
      </div>
    </>
  );
}

export default Calculator;
