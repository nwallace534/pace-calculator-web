import type { AnimationEvent } from "react";
import { useCallback, useState } from "react";

export type CardCloseAnimation = {
  closing: boolean;
  triggerClose: () => void;
  handleAnimationEnd: (e: AnimationEvent<HTMLDivElement>) => void;
};

const CLOSE_ANIMATION_NAME = "summary-card-flip-out";

// Two-step close so the flip-out animation plays before unmount; the
// mount's open animation bubbles through too so we match by name.
export function useCardCloseAnimation(
  onClosed: () => void,
): CardCloseAnimation {
  const [closing, setClosing] = useState(false);

  const triggerClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
  }, [closing]);

  const handleAnimationEnd = useCallback(
    (e: AnimationEvent<HTMLDivElement>) => {
      if (closing && e.animationName === CLOSE_ANIMATION_NAME) {
        onClosed();
      }
    },
    [closing, onClosed],
  );

  return { closing, triggerClose, handleAnimationEnd };
}
