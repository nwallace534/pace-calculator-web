import IconMinus from "@/assets/icon-minus.svg?react";
import IconPlus from "@/assets/icon-plus.svg?react";

import { createPopper, Instance } from "@popperjs/core";
import { PointerEvent, useEffect, useRef, useState } from "react";
import { SpinnerType } from "@/types/spinner";
import { trackOnce } from "@/utils/analytics";
import { AnalyticsEvent } from "@/utils/analytics-events";

// SpinnerButton — a held-button auto-repeat. The behaviour:
//
//   1. Press → fire one step immediately via onStep(±1).
//   2. Still held after HOLD_DELAY ms → an animation loop kicks in.
//   3. While held, the loop fires more steps at a rate that ramps from
//      MIN_RATE up to MAX_RATE on an exponential curve, so the first held
//      steps stay slow for fine-tuning, then speed up for bulk adjustment.
//   4. Release → loop stops instantly.
//
// The loop runs on requestAnimationFrame (rAF), the browser API for
// scheduling work just before the next screen repaint. Each rAF callback
// receives a timestamp; the difference between consecutive timestamps is
// the *delta time* (dt) we use to integrate velocity into whole steps —
// that keeps the spinner feeling the same on a 60Hz or a 120Hz display.
//
// Two non-obvious bits:
//
//   • A pointer press synthesises a click event after pointerup, so the
//     click handler swallows those and only serves real keyboard activations.
//
//   • A "you can also hold the button" hint chip appears once the user
//     rapid-taps enough to earn it. Popper.js positions it above the button;
//     its instance is kept alive until unmount so the fade-out plays without
//     the chip snapping back beside the button.

/** Per-event override of MIN_RATE / MAX_RATE — used for sub-second-step
 *  events whose value range is wider than 1s steps can traverse comfortably. */
type SpinnerTuning = {
  minRate?: number;
  maxRate?: number;
};

type SpinnerButtonProps = {
  type: SpinnerType;
  /** Signed step count. Fires once per click with ±1, then once per animation
   *  frame while held with the accumulated count. */
  onStep: (steps: number) => void;
  /** Tap = release before auto-repeat. Return true to surface the hold hint. */
  onTap?: () => boolean;
  /** Auto-repeat fired — the user held long enough. */
  onHold?: () => void;
  hintLabel?: string;
  /** Stops any in-flight hold immediately. */
  disabled?: boolean;
  ariaLabel: string;
  tuning?: SpinnerTuning;
};

const HOLD_DELAY = 250; // ms before auto-repeat begins
const MIN_RATE = 14; // steps/sec when auto-repeat starts
const MAX_RATE = 150; // steps/sec ceiling
// Acceleration ramp shape. After ACCEL_TAU ms of holding, the rate is
// ~63% of the way from MIN_RATE to MAX_RATE; after ~3× that, ~95%.
const ACCEL_TAU = 500;
const HINT_DURATION = 10000; // ms the hint stays visible once shown

const SpinnerButton = ({
  type,
  onStep,
  onTap,
  onHold,
  hintLabel,
  disabled,
  ariaLabel,
  tuning,
}: SpinnerButtonProps) => {
  const direction = type === SpinnerType.Up ? 1 : -1;
  const minRate = tuning?.minRate ?? MIN_RATE;
  const maxRate = tuning?.maxRate ?? MAX_RATE;

  const buttonRef = useRef<HTMLButtonElement>(null);

  const [showHint, setShowHint] = useState(false);
  const hintRef = useRef<HTMLDivElement>(null);
  const popperRef = useRef<Instance | null>(null);

  // Loop state — written every animation frame, must not trigger re-renders.
  const frameRef = useRef<number | null>(null); // rAF handle, or null when stopped
  const holdTimerRef = useRef<number | null>(null); // HOLD_DELAY setTimeout handle
  const holdingRef = useRef(false); // is a press currently active
  const repeatBegunRef = useRef(false); // did this press reach auto-repeat
  const velocityRef = useRef(0); // current rate in steps/sec
  const accumulatorRef = useRef(0); // fractional steps not yet emitted
  const lastFrameRef = useRef(0); // ms timestamp of the previous frame
  const pointerUsedRef = useRef(false); // see handleClick

  const onStepRef = useRef(onStep);
  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  const stopLoop = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    velocityRef.current = 0;
    accumulatorRef.current = 0;
  };

  // Fires HOLD_DELAY ms after pointerdown, if the press is still held. Seeds
  // velocity at MIN_RATE and kicks off the rAF loop. The outer rAF call exists
  // only to capture a start timestamp from its argument — calling
  // performance.now() directly here would trip a lint rule.
  const beginRepeat = () => {
    holdTimerRef.current = null;
    if (!holdingRef.current) return;
    repeatBegunRef.current = true;
    velocityRef.current = minRate;
    frameRef.current = requestAnimationFrame((startNow) => {
      lastFrameRef.current = startNow;
      frameRef.current = requestAnimationFrame(tick);
    });
  };

  const tick = (now: number) => {
    // Delta time (dt) in seconds since the previous frame. Clamped at 100ms
    // so a backgrounded tab — where rAF pauses — can't emit a step burst on
    // return; the first frame back would otherwise carry a huge gap.
    const dt = Math.min((now - lastFrameRef.current) / 1000, 0.1);
    lastFrameRef.current = now;

    // Exponential ease toward MAX_RATE. ACCEL_TAU is in ms, dt in seconds,
    // hence the /1000 to match units.
    velocityRef.current +=
      (maxRate - velocityRef.current) *
      (1 - Math.exp(-dt / (ACCEL_TAU / 1000)));

    accumulatorRef.current += velocityRef.current * dt;
    const steps = Math.floor(accumulatorRef.current);
    if (steps > 0) {
      accumulatorRef.current -= steps;
      onStepRef.current(direction * steps);
    }

    frameRef.current = requestAnimationFrame(tick);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return; // primary button / touch only
    if (disabled) return;
    pointerUsedRef.current = true;

    onStepRef.current(direction);

    holdingRef.current = true;
    holdTimerRef.current = window.setTimeout(beginRepeat, HOLD_DELAY);
  };

  // pointerup/leave/cancel can all fire for one press; the guard ensures we
  // classify tap-vs-hold exactly once.
  const handleRelease = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;

    const wasHold = repeatBegunRef.current;
    repeatBegunRef.current = false;
    stopLoop();

    if (wasHold) {
      trackOnce(AnalyticsEvent.SpinnerHeld, { direction: type });
      onHold?.();
    } else {
      trackOnce(AnalyticsEvent.SpinnerUsed, { direction: type });
      if (onTap?.()) {
        setShowHint(true);
      }
    }
  };

  const handleClick = () => {
    // Swallow the synthetic click that follows a pointer press — we already
    // stepped in handlePointerDown. Keyboard activations (Space/Enter) have
    // no preceding pointer event, so they fall through and emit the step.
    if (pointerUsedRef.current) {
      pointerUsedRef.current = false;
      return;
    }
    if (disabled) return;
    onStepRef.current(direction);
  };

  // Bound hit mid-hold → halt the loop, instead of pumping clamped no-op
  // steps against an unmoving cap.
  useEffect(() => {
    if (!disabled) return;
    if (
      !holdingRef.current &&
      frameRef.current === null &&
      holdTimerRef.current === null
    )
      return;
    holdingRef.current = false;
    repeatBegunRef.current = false;
    stopLoop();
  }, [disabled]);

  useEffect(() => {
    return () => {
      stopLoop();
      popperRef.current?.destroy();
    };
  }, []);

  // Keep the Popper instance alive until unmount — destroying on hide resets
  // the inline transform mid-fade and the chip snaps back beside the button.
  useEffect(() => {
    if (!showHint || popperRef.current) return;
    if (!buttonRef.current || !hintRef.current) return;

    popperRef.current = createPopper(buttonRef.current, hintRef.current, {
      placement: "top",
      modifiers: [
        { name: "offset", options: { offset: [0, 8] } },
        { name: "preventOverflow", options: { boundary: "viewport" } },
        { name: "flip", options: { fallbackPlacements: ["bottom"] } },
      ],
    });
  }, [showHint]);

  useEffect(() => {
    if (!showHint) return;
    const timer = window.setTimeout(() => setShowHint(false), HINT_DURATION);
    return () => window.clearTimeout(timer);
  }, [showHint]);

  return (
    <span className="position-relative d-inline-block">
      <button
        ref={buttonRef}
        className={`btn spinner-btn spinner-btn-${type} text-ginormous py-0`}
        type="button"
        style={{ touchAction: "manipulation" }}
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handleRelease}
        onPointerLeave={handleRelease}
        onPointerCancel={handleRelease}
      >
        {type === SpinnerType.Down && <IconMinus height="3rem" width="3rem" />}
        {type === SpinnerType.Up && <IconPlus height="3rem" width="3rem" />}
      </button>

      {hintLabel && (
        <div
          ref={hintRef}
          role="status"
          aria-live="polite"
          className={`spinner-hint bg-body text-body border shadow-sm rounded px-3 py-2 small${
            showHint ? " spinner-hint-show" : ""
          }`}
        >
          {hintLabel}
        </div>
      )}
    </span>
  );
};

export default SpinnerButton;
