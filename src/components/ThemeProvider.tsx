import useCalculatorStore from "@/state/useCalculatorStore";
import { useEffect } from "react";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useCalculatorStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  return <>{children}</>;
};
