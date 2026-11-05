// Purpose: Hook running continuous frame capture, prediction loop, and anti-spam auto-append
import { useEffect, useRef, useCallback } from 'react';
import { useRecognitionContext } from '../context/RecognitionContext';
import { predict } from '../api/client';
import { captureFrame } from '../utils/captureFrame';
import { drawLandmarks } from '../utils/drawLandmarks';
import { formatConfidencePercent } from '../utils/confidence';
import {
  FRAME_INTERVAL_MS,
  CONFIDENCE_THRESHOLDS,
  AUTO_APPEND_CONSECUTIVE_FRAMES
} from '../config/constants';

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
    setStatusText
  } = useRecognitionContext();

  const isProcessingRef = useRef(false);
  const consecutiveLetterRef = useRef({ letter: null, count: 0 });
  const lockedRef = useRef(false); // Locked until gap occurs

  const processFrame = useCallback(async () => {
    // Skip this tick if previous API call is still pending
    if (isProcessingRef.current) return;
    if (!videoRef?.current) return;

    const frameBase64 = captureFrame(videoRef.current);
    if (!frameBase64) return;

    isProcessingRef.current = true;
    setCapturedThumbnail(frameBase64);
    setStatusText('Processing ISL predictions…');

    try {
      const result = await predict(frameBase64, isDemoActive);

      // Draw or clear landmarks based on toggle
      if (canvasRef?.current) {
        if (showLandmarks && result.landmarks && result.landmarks.length > 0) {
          drawLandmarks(canvasRef.current, result.landmarks);
        } else {
          drawLandmarks(canvasRef.current, []);
        }
      }

      // Update active prediction
      setActivePrediction(result);

      // Update one-line status
      if (result.hand_detected && result.letter) {
        setStatusText(`Successfully predicted letter '${result.letter}' (${formatConfidencePercent(result.confidence)})`);
      } else {
        setStatusText('No hand detected');
      }

      // Auto-append logic with required hand-removed or letter-change gap
      const isHighConfidence =
        result.hand_detected &&
        result.letter &&
        result.confidence >= CONFIDENCE_THRESHOLDS.HIGH;

      if (isHighConfidence) {
        if (consecutiveLetterRef.current.letter === result.letter) {
          consecutiveLetterRef.current.count += 1;
        } else {
          // Different letter detected: reset counter and unlock
          consecutiveLetterRef.current = { letter: result.letter, count: 1 };
          lockedRef.current = false;
        }

        // Trigger append when threshold reached and not locked
        if (
          !lockedRef.current &&
          consecutiveLetterRef.current.count >= AUTO_APPEND_CONSECUTIVE_FRAMES
        ) {
          appendText(result.letter);
          addToHistory(result);
          // Lock further appends of this held sign until hand moves away or changes
          lockedRef.current = true;
        }
      } else {
        // Hand removed or low confidence: reset count and release lock gap
        consecutiveLetterRef.current = { letter: null, count: 0 };
        lockedRef.current = false;
      }
    } catch (err) {
      console.warn('Frame prediction error:', err.message);
      setStatusText(`Error: ${err.message}`);
      if (canvasRef?.current) {
        drawLandmarks(canvasRef.current, []);
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [
    videoRef,
    canvasRef,
    isDemoActive,
    showLandmarks,
    setActivePrediction,
    setCapturedThumbnail,
    setStatusText,
    appendText,
    addToHistory
  ]);

  // Frame polling interval (~500ms)
  useEffect(() => {
    if (!isRecognizing) {
      if (canvasRef?.current) {
        drawLandmarks(canvasRef.current, []);
      }
      setStatusText('Recognition paused');
      return;
    }

    const intervalId = setInterval(() => {
      processFrame();
    }, FRAME_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isRecognizing, processFrame, canvasRef, setStatusText]);

  const startRecognition = useCallback(() => {
    setIsRecognizing(true);
    setStatusText('Processing ISL predictions…');
  }, [setIsRecognizing, setStatusText]);

  const stopRecognition = useCallback(() => {
    setIsRecognizing(false);
    consecutiveLetterRef.current = { letter: null, count: 0 };
    lockedRef.current = false;
    if (canvasRef?.current) {
      drawLandmarks(canvasRef.current, []);
    }
    setStatusText('Recognition stopped');
  }, [setIsRecognizing, canvasRef, setStatusText]);

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
