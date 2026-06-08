import { useEffect } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import Calculator from "./modules/Calculator";
import Footer from "./modules/Footer";
import Header from "./modules/Header";
import useCalculatorStore from "./state/useCalculatorStore";
import { applySharedTarget, parseSharedTarget } from "./utils/shareTarget";

function SharedTargetLoader() {
  useEffect(() => {
    const target = parseSharedTarget(window.location.search);
    if (!target) return;

    applySharedTarget(target, useCalculatorStore.getState());
  }, []);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <SharedTargetLoader />
      <Header />
      <div className="mt-5">
        <Calculator />
      </div>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
