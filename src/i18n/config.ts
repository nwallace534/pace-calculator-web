import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enMessages from "../../messages/en.json";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      theme: enMessages.theme,
      footer: enMessages.footer,
      calculator: enMessages.calculator,
      events: enMessages.events,
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});
