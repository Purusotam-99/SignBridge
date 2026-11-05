// Purpose: Sign Language Input card with dark webcam feed, landmark overlay, thumbnail, and controls
import React from 'react';
import { Camera, CameraOff, Eye, EyeOff, Play, Square, AlertCircle, RefreshCw } from 'lucide-react';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import IconButton from '../common/IconButton';

export default function WebcamPanel({
  videoRef,
  canvasRef,
  isStreaming,
  isLoading,
  error,
  isRecognizing,
  onToggleWebcam,
  onToggleRecognition,
  showLandmarks,
  onToggleLandmarks,
  isConnected,
  statusText,
  capturedThumbnail
}) {
  return (
    <Card
      title="Sign Language Input"
      subtitle="Webcam stream with 21-point hand mesh analysis"
      icon={<Camera className="w-4 h-4 text-slate-600" />}
      action={
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Active / Idle */}
          <StatusBadge
            status={isRecognizing ? 'active' : 'idle'}
            label={isRecognizing ? 'Active' : 'Idle'}
            size="xs"
          />

          {/* Processing badge */}
          {isRecognizing && (
            <StatusBadge
              status="processing"
              label="Processing"
              pulse={true}
              size="xs"
            />
          )}

          {/* Connected / Disconnected */}
          <StatusBadge
            status={isConnected ? 'connected' : 'disconnected'}
            label={isConnected ? 'Connected' : 'Disconnected'}
            size="xs"
          />
        </div>
      }
      bodyClassName="p-4 sm:p-5 space-y-4"
    >
      {/* Dark webcam preview viewport */}
      <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
        {/* Active HTML5 video */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
            isStreaming ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Landmarks Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none z-10 ${
            isStreaming && showLandmarks ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Offline / inactive placeholder */}
        {!isStreaming && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center p-6 text-center z-20 space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
              <CameraOff className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Camera Inactive</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Enable camera to begin recognizing ISL signs A, B, and C.</p>
            </div>
            <IconButton
              icon={<Camera className="w-3.5 h-3.5" />}
              label="Start Camera"
              variant="primary"
              size="sm"
              onClick={onToggleWebcam}
            />
          </div>
        )}

        {/* Camera Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center z-20 space-y-2">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-300">Initializing webcam…</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center p-4 text-center z-20 space-y-2 max-w-xs">
            <AlertCircle className="w-6 h-6 text-rose-400" />
            <p className="text-xs text-rose-300 font-medium">{error}</p>
            <IconButton
              icon={<RefreshCw className="w-3 h-3" />}
              label="Retry"
              variant="secondary"
              size="sm"
              onClick={onToggleWebcam}
            />
          </div>
        )}

        {/* Inset captured-gesture thumbnail (top-right) */}
        {isStreaming && capturedThumbnail && (
          <div className="absolute top-2.5 right-2.5 z-20 p-1 bg-slate-950/80 rounded-md border border-slate-700 shadow-sm backdrop-blur-xs">
            <div className="relative w-14 h-11 rounded overflow-hidden bg-slate-900">
              <img
                src={capturedThumbnail}
                alt="Captured gesture snapshot"
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-center text-slate-200 font-mono">
                FRAME
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons and Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Red Stop / Blue-Lavender Start Button */}
        <div className="flex items-center space-x-2">
          {isStreaming ? (
            <button
              type="button"
              onClick={onToggleRecognition}
              aria-label={isRecognizing ? 'Stop Recognition' : 'Start Recognition'}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                isRecognizing
                  ? 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500' // Distinct Red for Stop button
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'
              }`}
            >
              {isRecognizing ? (
                <>
                  <Square className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  Stop Recognition
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  Start Recognition
                </>
              )}
            </button>
          ) : (
            <IconButton
              icon={<Camera className="w-3.5 h-3.5" />}
              label="Turn On Camera"
              variant="primary"
              size="sm"
              onClick={onToggleWebcam}
            />
          )}

          {/* Landmarks Toggle */}
          <button
            type="button"
            onClick={onToggleLandmarks}
            aria-label={showLandmarks ? 'Hide Hand Landmarks' : 'Show Hand Landmarks'}
            title={showLandmarks ? 'Hide Hand Landmarks' : 'Show Hand Landmarks'}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              showLandmarks
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showLandmarks ? (
              <>
                <Eye className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                Landmarks On
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                Landmarks Off
              </>
            )}
          </button>
        </div>

        {/* Camera Stop button if streaming */}
        {isStreaming && (
          <button
            type="button"
            onClick={onToggleWebcam}
            aria-label="Stop Webcam"
            className="text-xs text-slate-500 hover:text-slate-800 underline self-center"
          >
            Turn off camera
          </button>
        )}
      </div>

      {/* One-line status text with indicator dot */}
      <div className="pt-2 border-t border-slate-100 flex items-center text-xs text-slate-600">
        <span
          className={`inline-block w-2 h-2 rounded-full mr-2 ${
            isRecognizing ? 'bg-sky-500 animate-pulse' : 'bg-slate-400'
          }`}
        />
        <span className="font-medium truncate">{statusText || 'Camera idle'}</span>
      </div>
    </Card>
  );
}
