// Purpose: Text input interface converting input letters into sign language representations
import React from 'react';
import { Type, Sparkles, X } from 'lucide-react';
import Card from '../common/Card';
import IconButton from '../common/IconButton';
import { SUPPORTED_LETTERS } from '../../config/constants';

const PRESETS = ['CAB', 'ABC', 'BAC', 'ACC', 'BABA'];

export default function SignInput({
  value = '',
  onChange,
  onClear,
  onSelectPreset
}) {
  return (
    <Card
      title="Input Text"
      subtitle={`Alphabet vocabulary: ${SUPPORTED_LETTERS.join(', ')}`}
      icon={<Type className="w-4 h-4 text-slate-600" />}
      action={
        value && (
          <IconButton
            icon={<X className="w-3.5 h-3.5" />}
            label="Clear"
            variant="secondary"
            size="sm"
            onClick={onClear}
            ariaLabel="Clear input text"
          />
        )
      }
      bodyClassName="p-4 sm:p-5 space-y-3"
    >
      <div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="Type letters (e.g. CAB, ABC)…"
          aria-label="Input text for fingerspelling"
          className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-base font-mono font-semibold tracking-widest text-slate-900 uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-slate-500 flex items-center font-medium">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
          Quick Samples:
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onSelectPreset(preset)}
            className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 shadow-2xs transition-colors"
          >
            {preset}
          </button>
        ))}
      </div>
    </Card>
  );
}
