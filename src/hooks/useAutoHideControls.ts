import { useCallback, useEffect, useRef, useState } from "react";

// pinOpen / fadeNow let a modal interaction (e.g. title edit) override the
// auto-hide timer.
export type AutoHideControls = {
  visible: boolean;
  reveal: () => void;
  pinOpen: () => void;
  fadeNow: () => void;
};

export function useAutoHideControls({
  hideDelayMs = 3000,
}: { hideDelayMs?: number } = {}): AutoHideControls {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = useCallback((delayMs: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), delayMs);
  }, []);

  useEffect(() => {
    // rAF so the opacity transition fires from a hidden start; without it
    // the controls would flash visible on first paint.
    const rafId = requestAnimationFrame(() => {
      setVisible(true);
      scheduleHide(hideDelayMs);
    });
    return () => {
      cancelAnimationFrame(rafId);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleHide, hideDelayMs]);

  const reveal = useCallback(() => {
    setVisible(true);
    scheduleHide(hideDelayMs);
  }, [scheduleHide, hideDelayMs]);

  const pinOpen = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
  }, []);

  const fadeNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return { visible, reveal, pinOpen, fadeNow };
}
