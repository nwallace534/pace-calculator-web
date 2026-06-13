import { useCallback, useEffect, useRef, useState } from "react";

// Mounts hidden, fades in on the next frame so the opacity transition fires,
// then auto-hides. `pinOpen` + `fadeNow` are for modal interactions (e.g.
// title editing) that need to override the timer.
export type AutoHideChrome = {
  visible: boolean;
  reveal: () => void;
  pinOpen: () => void;
  fadeNow: () => void;
};

export function useAutoHideChrome({
  hideDelayMs = 3000,
}: { hideDelayMs?: number } = {}): AutoHideChrome {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = useCallback((delayMs: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), delayMs);
  }, []);

  useEffect(() => {
    // rAF so the opacity transition fires from a hidden start, not from
    // first paint (which would flash visible-then-faded).
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
