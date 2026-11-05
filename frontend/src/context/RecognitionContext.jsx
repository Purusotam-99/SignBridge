// Purpose: Global recognition state provider: history, text builder, connection, and settings
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getHealth } from '../api/client';

const RecognitionContext = createContext(null);

export function RecognitionProvider({ children }) {
  // Active prediction state
  const [activePrediction, setActivePrediction] = useState({
    hand_detected: false,
    letter: null,
    confidence: 0,
    probabilities: { A: 0, B: 0, C: 0 },
    top_predictions: [],
    landmarks: [],
    is_simulated: false
  });

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [capturedThumbnail, setCapturedThumbnail] = useState(null);
  const [statusText, setStatusText] = useState('Camera idle');

  // Text builder state
  const [text, setText] = useState('');

  // Recognition history log
  const [history, setHistory] = useState([]);

  // Backend connection status
  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: false,
    status: 'checking',
    modelLoaded: false,
    details: null
  });

  // Check backend server health
  const refreshConnection = useCallback(async () => {
    try {
      const health = await getHealth();
      if (health.isOnline) {
        setConnectionStatus({
          isOnline: true,
          status: 'online',
          modelLoaded: Boolean(health.model_loaded),
          details: health
        });
      } else {
        setConnectionStatus({
          isOnline: false,
          status: 'offline',
          modelLoaded: false,
          details: null
        });
      }
    } catch {
      setConnectionStatus({
        isOnline: false,
        status: 'offline',
        modelLoaded: false,
        details: null
      });
    }
  }, []);

  useEffect(() => {
    refreshConnection();
    const interval = setInterval(refreshConnection, 12000);
    return () => clearInterval(interval);
  }, [refreshConnection]);

  // If backend is offline, user can activate demoMode or it auto-enables when offline
  const isDemoActive = demoMode || !connectionStatus.isOnline;

  // History handlers
  const addToHistory = useCallback((pred) => {
    if (!pred || !pred.letter) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      letter: pred.letter,
      confidence: pred.confidence,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      is_simulated: Boolean(pred.is_simulated)
    };
    setHistory((prev) => [entry, ...prev.slice(0, 49)]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Text builder handlers
  const appendText = useCallback((letter) => {
    if (!letter) return;
    setText((prev) => prev + letter);
  }, []);

  const addSpace = useCallback(() => {
    setText((prev) => (prev.endsWith(' ') ? prev : prev + ' '));
  }, []);

  const backspaceText = useCallback(() => {
    setText((prev) => prev.slice(0, -1));
  }, []);

  const clearText = useCallback(() => {
    setText('');
  }, []);

  const value = {
    // Prediction state
    activePrediction,
    setActivePrediction,
    isRecognizing,
    setIsRecognizing,
    showLandmarks,
    setShowLandmarks,
    demoMode,
    setDemoMode,
    isDemoActive,
    capturedThumbnail,
    setCapturedThumbnail,
    statusText,
    setStatusText,

    // Text builder state
    text,
    setText,
    appendText,
    addSpace,
    backspaceText,
    clearText,

    // History state
    history,
    addToHistory,
    clearHistory,

    // Connection state
    connectionStatus,
    refreshConnection
  };

  return (
    <RecognitionContext.Provider value={value}>
      {children}
    </RecognitionContext.Provider>
  );
}

export function useRecognitionContext() {
  const context = useContext(RecognitionContext);
  if (!context) {
    throw new Error('useRecognitionContext must be used within RecognitionProvider');
  }
  return context;
}
