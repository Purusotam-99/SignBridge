// Purpose: Displays target sign reference images and posture hints for ISL A, B, and C
import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, Sparkles } from 'lucide-react';
import Card from '../common/Card';
import { SIGN_INFO, SUPPORTED_LETTERS } from '../../config/constants';

export default function GesturePreview({ letter = null }) {
  // 'all' shows all 3 reference cards; 'A', 'B', or 'C' shows focused detailed view
  const [selectedLetter, setSelectedLetter] = useState('all');

  // When a valid letter is detected from live recognition, auto-highlight it
  useEffect(() => {
    if (letter && SIGN_INFO[letter]) {
      // Keep view in sync with detected letter if user was on 'all' or previously auto-switched
    }
  }, [letter]);

  const activeInfo = letter && SIGN_INFO[letter] ? SIGN_INFO[letter] : null;

  return (
    <Card
      title="Target Sign Reference"
      subtitle={
        activeInfo
          ? `Currently matching Sign "${letter}"`
          : 'Visual posture hints for ISL gestures A, B, and C'
      }
      icon={<Eye className="w-4 h-4 text-slate-600" />}
      action={
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setSelectedLetter('all')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              selectedLetter === 'all'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            All
          </button>
          {SUPPORTED_LETTERS.map((l) => {
            const isDetected = letter === l;
            const isSelected = selectedLetter === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setSelectedLetter(l)}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center space-x-1 ${
                  isSelected
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : isDetected
                    ? 'text-emerald-700 font-bold bg-emerald-50'
                    : 'hover:text-slate-900'
                }`}
              >
                <span>{l}</span>
                {isDetected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      }
      bodyClassName="p-3.5 sm:p-4"
    >
      {selectedLetter === 'all' ? (
        /* Multi-Sign Overview Grid showing all 3 reference images */
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {SUPPORTED_LETTERS.map((l) => {
            const info = SIGN_INFO[l];
            const isDetected = letter === l;

            return (
              <div
                key={l}
                onClick={() => setSelectedLetter(l)}
                className={`group relative flex flex-col items-center p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isDetected
                    ? 'border-emerald-400 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-300'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {/* Active Match Badge */}
                {isDetected && (
                  <span className="absolute -top-2 right-2 inline-flex items-center space-x-0.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Match</span>
                  </span>
                )}

                {/* Reference Image Thumbnail */}
                <div className="w-full aspect-square max-h-24 sm:max-h-28 rounded-lg overflow-hidden bg-white border border-slate-200/80 flex items-center justify-center p-1.5 transition-transform group-hover:scale-[1.02]">
                  <img
                    src={info.image}
                    alt={`ISL Sign ${l} posture reference`}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Label & Hint */}
                <div className="mt-2 text-center w-full">
                  <div className="flex items-center justify-center space-x-1">
                    <span
                      className={`text-xs font-bold ${
                        isDetected ? 'text-emerald-800' : 'text-slate-800'
                      }`}
                    >
                      {info.name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500 leading-tight line-clamp-2">
                    {info.hint || info.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Single Focused Sign View with Detailed Description */
        (() => {
          const info = SIGN_INFO[selectedLetter] || SIGN_INFO['A'];
          const isDetected = letter === selectedLetter;

          return (
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 bg-slate-50/80 border border-slate-200 rounded-xl p-3 sm:p-3.5">
              {/* Reference Image */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 p-2 flex items-center justify-center shadow-2xs">
                <img
                  src={info.image}
                  alt={`ISL Sign for ${info.letter}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Detailed Posture Guidance */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-900">
                    {info.name}
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold">
                    Target Guide
                  </span>
                  {isDetected && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Live Match</span>
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {info.description}
                </p>

                <div className="mt-2.5 flex items-center space-x-2">
                  <span className="text-[11px] font-medium text-slate-500">
                    Key Landmark:
                  </span>
                  <span className="text-[11px] font-mono text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {info.hint}
                  </span>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </Card>
  );
}
