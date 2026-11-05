// Purpose: Router and main layout shell for SignBridge navigation
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RecognitionProvider } from './context/RecognitionContext';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import LiveRecognition from './pages/LiveRecognition';
import TextToSign from './pages/TextToSign';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <RecognitionProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/live" element={<LiveRecognition />} />
              <Route path="/text-to-sign" element={<TextToSign />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <footer className="border-t border-slate-200/80 py-5 text-center text-xs text-slate-500 bg-white/40">
            <p>SignBridge • Indian Sign Language Alphabet Assistant • Vocabulary: A, B, C</p>
          </footer>
        </div>
      </BrowserRouter>
    </RecognitionProvider>
  );
}
