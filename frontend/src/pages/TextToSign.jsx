// Purpose: Text to Sign fingerspelling translation page
import React, { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import SignInput from '../components/textToSign/SignInput';
import SignGrid from '../components/textToSign/SignGrid';

export default function TextToSign() {
  const [text, setText] = useState('CAB');

  return (
    <PageContainer
      titleBlock={
        <div>
          <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
            DICTIONARY & FINGERSPELLING
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Text to Sign Studio
          </h1>
          <p className="text-xs text-slate-500">
            Convert words into Indian Sign Language alphabet posture cards.
          </p>
        </div>
      }
    >
      <div className="space-y-5">
        <SignInput
          value={text}
          onChange={setText}
          onClear={() => setText('')}
          onSelectPreset={(preset) => setText(preset)}
        />

        <SignGrid text={text} />
      </div>
    </PageContainer>
  );
}
