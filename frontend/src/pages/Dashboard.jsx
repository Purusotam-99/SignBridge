// Purpose: Dashboard page with centered title block, 2-column input/prediction grid, and history card
import React, { useRef } from 'react';
import PageContainer from '../components/layout/PageContainer';
import WebcamPanel from '../components/recognition/WebcamPanel';
import PredictionPanel from '../components/recognition/PredictionPanel';
import TextBuilder from '../components/recognition/TextBuilder';
import HistoryList from '../components/recognition/HistoryList';
import { useWebcam } from '../hooks/useWebcam';
import { useRecognition } from '../hooks/useRecognition';
import { useRecognitionContext } from '../context/RecognitionContext';

export default function Dashboard() {
  const canvasRef = useRef(null);

  // Hook 1: Webcam stream management
  const {
    videoRef,
    isStreaming,
    isLoading,
    error,
    toggleWebcam
  } = useWebcam();

  // Hook 2: Recognition loop and prediction cycles
  const {
    isRecognizing,
    toggleRecognition
  } = useRecognition(videoRef, canvasRef);

  // Recognition shared context
  const {
    activePrediction,
    showLandmarks,
    setShowLandmarks,
    connectionStatus,
    statusText,
    capturedThumbnail
  } = useRecognitionContext();

  return (
    <PageContainer maxWidth="max-w-7xl">
      {/* Centered Title Block matching reference design */}
      <div className="text-center max-w-2xl mx-auto space-y-2 py-1">
        <span className="inline-block text-[10px] font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
          ISL ALPHABET RECOGNITION
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Indian Sign Language Communication Bridge
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          Translate ISL gestures into text and speech with AI-powered recognition.
        </p>
      </div>

      {/* Main Two-Column Grid (No card overlap) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Sign Language Input */}
        <div className="lg:col-span-7">
          <WebcamPanel
            videoRef={videoRef}
            canvasRef={canvasRef}
            isStreaming={isStreaming}
            isLoading={isLoading}
            error={error}
            isRecognizing={isRecognizing}
            onToggleWebcam={toggleWebcam}
            onToggleRecognition={toggleRecognition}
            showLandmarks={showLandmarks}
            onToggleLandmarks={() => setShowLandmarks((prev) => !prev)}
            isConnected={connectionStatus.isOnline}
            statusText={statusText}
            capturedThumbnail={capturedThumbnail}
          />
        </div>

        {/* Right Column, Stacked: Prediction Card + Text Builder */}
        <div className="lg:col-span-5 space-y-5">
          <PredictionPanel
            prediction={activePrediction}
            isRecognizing={isRecognizing}
          />

          <TextBuilder />
        </div>
      </div>

      {/* Full-width Bottom Card: Recognition History */}
      <div className="w-full pt-1">
        <HistoryList />
      </div>
    </PageContainer>
  );
}
