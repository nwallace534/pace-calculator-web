import { useCallback, useEffect, useRef, useState } from "react";

// Drives the fade-in/auto-fade-out behaviour of the summary card's chrome
// (controls, screenshot-mode toast, from-share hint). Mounts hidden, fades in
// on the next frame so the opacity transition fires, then schedules a hide.
// `reveal()` resets the hide countdown — wire it to user interaction (tap,
// move, etc.) to keep the controls visible while the user is engaging. Use
// `pinOpen()` while a modal interaction (e.g. title editing) holds the chrome
// open with no timer; pair it with `fadeNow()` on the modal's resolve to
// snap the chrome straight to hidden.
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
    // Mount with controls invisible, then flip on next frame so the opacity
    // transition fires (no flash; controls appear via the fade-in).
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
