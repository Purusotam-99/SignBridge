// Purpose: Displays reference gesture image for the currently detected sign
import React from 'react';
import { Eye, Info } from 'lucide-react';
import Card from '../common/Card';
import { SIGN_INFO } from '../../config/constants';

export default function GesturePreview({ letter }) {
  const info = letter && SIGN_INFO[letter] ? SIGN_INFO[letter] : null;

  return (
    <Card
      title="Target Sign Reference"
      subtitle={info ? `Posture guidance for sign "${letter}"` : 'Sign language posture hint'}
      icon={<Eye className="w-4 h-4 text-slate-600" />}
      bodyClassName="p-4"
    >
      {info ? (
        <div className="flex items-center space-x-3.5">
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 p-1">
            <img
              src={info.image}
              alt={`ISL Sign for ${info.letter}`}
              className="w-full h-full object-contain rounded"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800">
                {info.name}
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.2 rounded font-medium">
                Verified
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
              {info.description}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2 text-slate-400 py-1">
          <Info className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs text-slate-500">
            Form gesture A, B, or C in view of camera to see guide posture.
          </p>
        </div>
      )}
    </Card>
  );
}
