// Purpose: Individual sign card displaying sign illustration for A, B, C, or unsupported indicator
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { SIGN_INFO } from '../../config/constants';

export default function SignCard({ char, index }) {
  const upperChar = char.toUpperCase();
  const isSpace = char === ' ';
  const info = SIGN_INFO[upperChar];

  if (isSpace) {
    return (
      <div className="flex flex-col items-center justify-center h-44 w-28 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-2 text-center">
        <span className="text-[10px] uppercase font-mono text-slate-400">Word Gap</span>
        <div className="w-8 h-0.5 bg-slate-200 my-3 rounded-full" />
        <span className="text-[9px] text-slate-400">Space</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-44 w-28 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <span>#{index + 1}</span>
        {info && <span className="text-indigo-600 font-medium">ISL</span>}
      </div>

      {info ? (
        <>
          <div className="w-20 h-20 my-auto p-1 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <img
              src={info.image}
              alt={`ISL Sign for ${upperChar}`}
              className="w-full h-full object-contain rounded"
            />
          </div>
          <div className="text-center w-full mt-1">
            <span className="text-base font-bold text-slate-900 block leading-none">
              {upperChar}
            </span>
            <span className="text-[9px] text-slate-500 truncate block mt-0.5">
              Sign {upperChar}
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center my-auto text-center p-1">
          <HelpCircle className="w-6 h-6 text-amber-500 mb-1" />
          <span className="text-sm font-bold text-slate-700">{upperChar}</span>
          <span className="text-[9px] text-amber-600 mt-1 leading-tight">
            Unsupported letter
          </span>
        </div>
      )}
    </div>
  );
}
