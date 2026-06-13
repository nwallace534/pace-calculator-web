import type { AnimationEvent } from "react";
import { useCallback, useState } from "react";

export type CardCloseAnimation = {
  closing: boolean;
  triggerClose: () => void;
  handleAnimationEnd: (e: AnimationEvent<HTMLDivElement>) => void;
};

const CLOSE_ANIMATION_NAME = "summary-card-flip-out";

// Two-step close: triggerClose flips `closing` so the JSX swaps to the
// flip-out animation; handleAnimationEnd then fires onClosed. The open
// animation bubbles through the same handler on mount — match by name to
// ignore it.
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
