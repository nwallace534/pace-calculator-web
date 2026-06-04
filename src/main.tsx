import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n/config";
import App from "./App";
import "./globals.css";
import { initAnalytics, trackOnce } from "./utils/analytics";
import { AnalyticsEvent } from "./utils/analytics-events";
import useCalculatorStore from "./state/useCalculatorStore";

initAnalytics();

// "Did the user get a number out of the calculator?" — fires once per session
// on the first paceResults change after the bootstrap calc.
useCalculatorStore.subscribe((state, prev) => {
  if (state.paceResults !== prev.paceResults && state.paceResults) {
    trackOnce(AnalyticsEvent.CalculationCompleted);
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
