// Purpose: Grid rendering sequence of sign illustration cards with fingerspelling disclaimer
import React from 'react';
import { Layers, Info, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import SignCard from './SignCard';
import { SUPPORTED_LETTERS, DISCLAIMER_NOTE } from '../../config/constants';

export default function SignGrid({ text = '' }) {
  const characters = text.split('');

  // Check if any character is not in SUPPORTED_LETTERS and not space
  const unsupportedChars = characters.filter(
    (c) => c !== ' ' && !SUPPORTED_LETTERS.includes(c.toUpperCase())
  );
  const hasUnsupported = unsupportedChars.length > 0;

  return (
    <Card
      title="Fingerspelling Sequence"
      subtitle="Visual representation of each translated letter"
      icon={<Layers className="w-4 h-4 text-slate-600" />}
      bodyClassName="p-4 sm:p-5 space-y-4"
    >
      {/* Required Disclaimer Note */}
      <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Important Note:</strong> {DISCLAIMER_NOTE}
        </p>
      </div>

      {/* Warning if unsupported letters are present */}
      {hasUnsupported && (
        <div className="flex items-center space-x-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            Only <strong>A, B and C</strong> are supported right now. Unsupported characters are marked with a placeholder card.
          </span>
        </div>
      )}

      {/* Letter Grid or Empty State */}
      {characters.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-5 h-5" />}
          title="No text entered"
          description="Type letters A, B, or C above to preview their fingerspelling postures."
        />
      ) : (
        <div className="flex flex-wrap gap-3 items-center justify-start p-1">
          {characters.map((char, index) => (
            <SignCard
              key={`${char}-${index}`}
              char={char}
              index={index}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
