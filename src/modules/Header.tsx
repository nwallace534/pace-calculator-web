import { useTranslation } from "react-i18next";
import useCalculatorStore from "@/state/useCalculatorStore";
import { ToggleSwitch } from "@/components/ToggleSwitch";

function Header() {
  const { t } = useTranslation("theme");
  const toggleTheme = useCalculatorStore((state) => state.toggleTheme);
  const theme = useCalculatorStore((state) => state.theme);
  const logoSrc =
    theme === "dark"
      ? "/pacerly-full-logo-dark.svg"
      : "/pacerly-full-logo-light.svg";

  return (
    <nav className="navbar fixed-top border-bottom bg-body-tertiary py-1 small text-boldish d-flex justify-content-between align-items-center px-3">
      <div>
        <img src={logoSrc} width="126" height="24" alt={t("logoAlt")} />
      </div>

      <div className="d-flex align-items-center">
        <span
          className="me-2"
          onClick={toggleTheme}
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          {t("controlLabel")}
        </span>
        <ToggleSwitch
          isOn={theme === "dark"}
          onToggle={toggleTheme}
          ariaLabel={t("toggleAriaLabel")}
          id="toggleDarkMode"
        />
      </div>
    </nav>
  );
}

export default Header;
