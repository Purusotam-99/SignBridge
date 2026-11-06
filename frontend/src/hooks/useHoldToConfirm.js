// Purpose: Deterministic hold-to-confirm state machine with dropout grace and release gap
import { useRef, useCallback } from 'react';
import {
  HOLD_DURATION_MS,
  MIN_CONFIDENCE,
  DROPOUT_GRACE_MS,
  RELEASE_GAP_MS,
  SUPPORTED_LETTERS
} from '../config/constants.js';
import { normalizeConfidenceScore } from '../utils/confidence.js';

/**
 * Custom hook managing the 2-second hold-to-confirm logic.
 * Keeps all timing state strictly in refs to prevent closure staleness.
 * 
 * @param {Function} onAppend - Callback when candidate is successfully confirmed: (letter, prediction) => void
 * @returns {{ evaluateFrame: Function, reset: Function, candidateRef: Object, lockedRef: Object }}
 */
export function useHoldToConfirm(onAppend) {
  const candidateRef = useRef(null);
  const holdStartRef = useRef(0);
  const lastValidTimeRef = useRef(0);
  const lockedRef = useRef(false);
  const lastDecisionRef = useRef('Initialized');

  const reset = useCallback(() => {
    candidateRef.current = null;
    holdStartRef.current = 0;
    lastValidTimeRef.current = 0;
    lockedRef.current = false;
    lastDecisionRef.current = 'Reset';
  }, []);

  const evaluateFrame = useCallback((prediction, now = performance.now()) => {
    if (!prediction) {
      return {
        candidate: null,
        progress: 0,
        heldMs: 0,
        requiredMs: HOLD_DURATION_MS,
        isLocked: false,
        statusReason: 'Waiting for camera feed…',
        lastDecision: 'No prediction data',
        appendedThisTick: false
      };
    }

    // Rule 1: Normalize confidence score (0.0 to 1.0)
    const normConfidence = normalizeConfidenceScore(prediction.confidence);
    const handDetected = Boolean(prediction.hand_detected ?? prediction.detected);
    const predLetter = prediction.letter && SUPPORTED_LETTERS.includes(prediction.letter) ? prediction.letter : null;

    // Rule 2: Frame is valid ONLY if hand is detected, letter is in A/B/C, and confidence >= MIN_CONFIDENCE
    const isValid = handDetected && predLetter !== null && normConfidence >= MIN_CONFIDENCE;

    // Rule 6: Unlock when hand is absent or letter changed for at least RELEASE_GAP_MS
    if (lockedRef.current) {
      if (!isValid) {
        const absentTime = now - lastValidTimeRef.current;
        if (absentTime >= RELEASE_GAP_MS) {
          lockedRef.current = false;
          lastDecisionRef.current = `Unlocked after release gap of ${Math.round(absentTime)}ms`;
          console.debug(`[HoldToConfirm] ${lastDecisionRef.current}`);
        }
      } else if (predLetter !== candidateRef.current) {
        lockedRef.current = false;
        lastDecisionRef.current = `Unlocked due to sign change: ${candidateRef.current} -> ${predLetter}`;
        console.debug(`[HoldToConfirm] ${lastDecisionRef.current}`);
      }
    }

    // Rule 3 & 4: Candidate tracking & dropout grace tolerance
    if (isValid) {
      if (candidateRef.current === predLetter) {
        // Holding same letter: continue hold
        lastValidTimeRef.current = now;
      } else {
        // Different valid letter detected: switch candidate and restart hold clock
        candidateRef.current = predLetter;
        holdStartRef.current = now;
        lastValidTimeRef.current = now;
        lockedRef.current = false;
        lastDecisionRef.current = `New candidate '${predLetter}' at ${(normConfidence * 100).toFixed(1)}% confidence`;
        console.debug(`[HoldToConfirm] ${lastDecisionRef.current}`);
      }
    } else {
      // Invalid frame (dropped hand, flicker, or confidence < MIN_CONFIDENCE)
      if (candidateRef.current) {
        const timeSinceValid = now - lastValidTimeRef.current;
        if (timeSinceValid > DROPOUT_GRACE_MS) {
          // Grace period expired: reset candidate
          lastDecisionRef.current = `Candidate '${candidateRef.current}' dropped after ${Math.round(timeSinceValid)}ms without valid frame (grace: ${DROPOUT_GRACE_MS}ms)`;
          console.debug(`[HoldToConfirm] ${lastDecisionRef.current}`);
          candidateRef.current = null;
          holdStartRef.current = 0;
        } else {
          lastDecisionRef.current = `Dropout grace active for '${candidateRef.current}': ${Math.round(timeSinceValid)}ms / ${DROPOUT_GRACE_MS}ms`;
          console.debug(`[HoldToConfirm] ${lastDecisionRef.current}`);
        }
      } else {
        if (!handDetected) {
          lastDecisionRef.current = 'No hand detected';
        } else if (normConfidence < MIN_CONFIDENCE) {
          lastDecisionRef.current = `Low confidence: ${(normConfidence * 100).toFixed(1)}% < ${(MIN_CONFIDENCE * 100).toFixed(0)}%`;
        }
      }
    }

    // Rule 5: Calculate hold elapsed time & trigger append when HOLD_DURATION_MS reached
    let heldMs = 0;
    let progress = 0;
    let appendedThisTick = false;

    if (candidateRef.current) {
      heldMs = Math.max(0, now - holdStartRef.current);
      progress = Math.min(1.0, heldMs / HOLD_DURATION_MS);

      if (heldMs >= HOLD_DURATION_MS && !lockedRef.current) {
        lockedRef.current = true;
        appendedThisTick = true;
        const letterToAppend = candidateRef.current;
        lastDecisionRef.current = `Appended '${letterToAppend}' after ${Math.round(heldMs)}ms (confidence: ${(normConfidence * 100).toFixed(1)}%)`;
        console.debug(`[HoldToConfirm] ${lastDecisionRef.current}`);

        if (typeof onAppend === 'function') {
          onAppend(letterToAppend, prediction);
        }
      }
    }

    // User-facing reason explaining the current recognition state
    let statusReason = '';
    if (lockedRef.current) {
      statusReason = `Added '${candidateRef.current || 'letter'}'! Release hand to add another`;
    } else if (candidateRef.current) {
      const remainingSec = Math.max(0, (HOLD_DURATION_MS - heldMs) / 1000).toFixed(1);
      statusReason = `Hold '${candidateRef.current}' steady… ${remainingSec}s`;
    } else if (handDetected && predLetter && normConfidence < MIN_CONFIDENCE) {
      statusReason = `Low confidence (${Math.round(normConfidence * 100)}%), need ${Math.round(MIN_CONFIDENCE * 100)}%+`;
    } else if (handDetected) {
      statusReason = 'Detecting ISL sign…';
    } else {
      statusReason = 'No hand detected';
    }

    return {
      candidate: candidateRef.current,
      progress,
      heldMs: Math.round(heldMs),
      requiredMs: HOLD_DURATION_MS,
      isLocked: lockedRef.current,
      statusReason,
      lastDecision: lastDecisionRef.current,
      appendedThisTick
    };
  }, [onAppend]);

  return {
    evaluateFrame,
    reset,
    candidateRef,
    lockedRef,
    holdStartRef,
    lastValidTimeRef
  };
}
