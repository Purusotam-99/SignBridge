// Purpose: Hook running self-scheduling frame capture, prediction loop, and hold-to-confirm
import { useEffect, useRef, useCallback } from 'react';
import { useRecognitionContext } from '../context/RecognitionContext';
import { useHoldToConfirm } from './useHoldToConfirm';
import { predict } from '../api/client';
import { captureFrame } from '../utils/captureFrame';
import { drawLandmarks } from '../utils/drawLandmarks';
import { normalizeConfidenceScore } from '../utils/confidence';
import { FRAME_INTERVAL_MS, HOLD_DURATION_MS } from '../config/constants';

export function useRecognition(videoRef, canvasRef) {
  const {
    isRecognizing,
    setIsRecognizing,
    setActivePrediction,
    addToHistory,
    appendText,
    showLandmarks,
    isDemoActive,
    setCapturedThumbnail,
    setStatusText,
    setHoldState,
    triggerAppendFlash,
    setDebugInfo,
    setErrorMessage
  } = useRecognitionContext();

  const isRecognizingRef = useRef(false);
  const inFlightRef = useRef(false);
  const loopTimeoutRef = useRef(null);

  // Callback when a letter has been held for 2.0s
  const handleAppendConfirmed = useCallback((letter, result) => {
    appendText(letter);
    addToHistory(result);
    triggerAppendFlash(letter);
  }, [appendText, addToHistory, triggerAppendFlash]);

  const { evaluateFrame, reset: resetHold } = useHoldToConfirm(handleAppendConfirmed);

  // Process a single frame cycle: capture -> API -> hold logic
  const processFrame = useCallback(async () => {
    if (!isRecognizingRef.current) return;
    if (inFlightRef.current) return;
    if (!videoRef?.current) return;

    const frameBase64 = captureFrame(videoRef.current);
    if (!frameBase64) return;

    inFlightRef.current = true;
    setCapturedThumbnail(frameBase64);
    setStatusText('Processing ISL predictions…');
    setErrorMessage(null);

    const startFetch = performance.now();
    try {
      const result = await predict(frameBase64, isDemoActive);
      const latencyMs = Math.round(performance.now() - startFetch);

      // Rule 8: Abort or ignore responses that arrive after Stop was pressed
      if (!isRecognizingRef.current) {
        return;
      }

      // Draw landmarks on overlay canvas
      if (canvasRef?.current) {
        if (showLandmarks && result.landmarks && result.landmarks.length > 0) {
          drawLandmarks(canvasRef.current, result.landmarks);
        } else {
          drawLandmarks(canvasRef.current, []);
        }
      }

      // Update active prediction state
      setActivePrediction(result);

      // Run unified hold-to-confirm logic (used identically for both demo & real mode)
      const holdEval = evaluateFrame(result);
      setHoldState(holdEval);

      // Update live status line
      setStatusText(holdEval.statusReason);

      // Update live debug metrics
      setDebugInfo({
        rawResponse: result,
        normalizedConfidence: normalizeConfidenceScore(result.confidence),
        candidate: holdEval.candidate,
        heldMs: holdEval.heldMs,
        isLocked: holdEval.isLocked,
        latencyMs,
        lastDecision: holdEval.lastDecision
      });
    } catch (err) {
      if (!isRecognizingRef.current) return;

      const latencyMs = Math.round(performance.now() - startFetch);
      console.warn('Frame prediction error:', err.message);

      // Surface error visibly in the UI
      setErrorMessage(err.message);
      setStatusText(`Backend error: ${err.message}`);

      if (canvasRef?.current) {
        drawLandmarks(canvasRef.current, []);
      }

      // Evaluate hold with null to safely manage dropout grace
      const holdEval = evaluateFrame(null);
      setHoldState(holdEval);

      setDebugInfo((prev) => ({
        ...prev,
        latencyMs,
        lastDecision: `Request error: ${err.message}`
      }));
    } finally {
      inFlightRef.current = false;
    }
  }, [
    videoRef,
    canvasRef,
    isDemoActive,
    showLandmarks,
    evaluateFrame,
    setActivePrediction,
    setCapturedThumbnail,
    setStatusText,
    setHoldState,
    setDebugInfo,
    setErrorMessage
  ]);

  // Rule 7: Self-scheduling loop (capture -> await API -> hold logic -> setTimeout)
  useEffect(() => {
    isRecognizingRef.current = isRecognizing;

    if (!isRecognizing) {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
      resetHold();
      setHoldState({
        candidate: null,
        progress: 0,
        heldMs: 0,
        requiredMs: HOLD_DURATION_MS,
        isLocked: false,
        statusReason: 'Camera idle',
        lastDecision: 'Stopped'
      });
      if (canvasRef?.current) {
        drawLandmarks(canvasRef.current, []);
      }
      setStatusText('Recognition stopped');
      return;
    }

    let isMounted = true;

    const scheduleNext = async () => {
      if (!isMounted || !isRecognizingRef.current) return;
      await processFrame();
      if (isMounted && isRecognizingRef.current) {
        loopTimeoutRef.current = setTimeout(scheduleNext, FRAME_INTERVAL_MS);
      }
    };

    // Kick off initial cycle immediately
    scheduleNext();

    return () => {
      isMounted = false;
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
      }
    };
  }, [isRecognizing, processFrame, resetHold, setHoldState, canvasRef, setStatusText]);

  const startRecognition = useCallback(() => {
    setIsRecognizing(true);
    setStatusText('Processing ISL predictions…');
  }, [setIsRecognizing, setStatusText]);

  const stopRecognition = useCallback(() => {
    isRecognizingRef.current = false;
    setIsRecognizing(false);
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    resetHold();
    if (canvasRef?.current) {
      drawLandmarks(canvasRef.current, []);
    }
    setStatusText('Recognition stopped');
  }, [setIsRecognizing, resetHold, canvasRef, setStatusText]);

  const toggleRecognition = useCallback(() => {
    if (isRecognizing) {
      stopRecognition();
    } else {
      startRecognition();
    }
  }, [isRecognizing, startRecognition, stopRecognition]);

  return {
    isRecognizing,
    startRecognition,
    stopRecognition,
    toggleRecognition
  };
}
