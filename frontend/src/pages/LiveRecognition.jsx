// Purpose: Focused Live Recognition page with expanded webcam view, prediction panel, and text builder
import React, { useRef } from 'react';
import PageContainer from '../components/layout/PageContainer';
import WebcamPanel from '../components/recognition/WebcamPanel';
import PredictionPanel from '../components/recognition/PredictionPanel';
import TextBuilder from '../components/recognition/TextBuilder';
import GesturePreview from '../components/recognition/GesturePreview';
import HistoryList from '../components/recognition/HistoryList';
import { useWebcam } from '../hooks/useWebcam';
import { useRecognition } from '../hooks/useRecognition';
import { useRecognitionContext } from '../context/RecognitionContext';

export default function LiveRecognition() {
  const canvasRef = useRef(null);

  // Hook 1: Webcam stream management
  const {
    videoRef,
    isStreaming,
    isLoading,
    error,
    toggleWebcam
  } = useWebcam();

  // Hook 2: Recognition loop
  const {
    isRecognizing,
    toggleRecognition
  } = useRecognition(videoRef, canvasRef);

  // Recognition Context
  const {
    activePrediction,
    showLandmarks,
    setShowLandmarks,
    connectionStatus,
    statusText,
    capturedThumbnail
  } = useRecognitionContext();

  return (
    <PageContainer
      titleBlock={
        <div>
          <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
            FOCUSED RECOGNITION
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Live ISL Recognition Studio
          </h1>
          <p className="text-xs text-slate-500">
            Expanded camera feed for continuous alphabet recognition and live phrase assembly.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Larger Webcam View + Text Builder */}
        <div className="lg:col-span-8 space-y-5">
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

          <TextBuilder />
        </div>

        {/* Right Column: Prediction Panel, Reference Preview, and Live History */}
        <div className="lg:col-span-4 space-y-5">
          <PredictionPanel
            prediction={activePrediction}
            isRecognizing={isRecognizing}
          />

          <GesturePreview
            letter={activePrediction?.letter}
          />

          <HistoryList />
        </div>
      </div>
    </PageContainer>
  );
}
