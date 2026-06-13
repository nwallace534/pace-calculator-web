import type { AnimationEvent } from "react";
import { useCallback, useState } from "react";

// Two-step close for the summary card: triggerClose() flips `closing` true
// so the JSX swaps the flip-in animation for `summary-card-flip-out`, then
// handleAnimationEnd fires `onClosed` when the close keyframe finishes. The
// open animation also bubbles through this handler on mount — we ignore it
// by matching the animation name.
export type CardCloseAnimation = {
  closing: boolean;
  triggerClose: () => void;
  handleAnimationEnd: (e: AnimationEvent<HTMLDivElement>) => void;
};

const CLOSE_ANIMATION_NAME = "summary-card-flip-out";

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
