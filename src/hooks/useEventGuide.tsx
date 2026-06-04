import { useMemo } from "react";
import useCalculatorStore from "@/state/useCalculatorStore";
import { Events } from "@/utils/events";
import { useTranslation } from "react-i18next";

type TranslatedEventGuide = {
  title: string;
  description: string;
  timeExamples: {
    id: string;
    label: string;
    time: {
      timeHours: string;
      timeMinutes: string;
      timeSeconds: string;
      timeHundredths: string;
    };
  }[];
};

function useEventGuide(): { eventGuide: TranslatedEventGuide | null } {
  const event = useCalculatorStore((state) => state.event);
  const { t } = useTranslation("events");

  const eventGuide = useMemo(() => {
    const rawEvent = Events.find((eventOption) => eventOption.id === event);
    if (!rawEvent?.eventGuide) return null;

    const translatedGuide: TranslatedEventGuide = {
      title: t("calculator:result.eventGuideTitle", {
        event: t(`event.${event}.label`),
      }),
      description: t(`event.${event}.guide.description`),
      timeExamples: rawEvent.eventGuide.timeExamples.map((example) => ({
        id: example.id,
        label: t(`event.${event}.${example.id}.label`),
        time: example.time,
      })),
    };

    return translatedGuide;
  }, [event, t]);

  return { eventGuide };
}

export default useEventGuide;
