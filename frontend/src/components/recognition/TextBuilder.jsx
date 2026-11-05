// Purpose: Text Builder card with auto-appending textarea, Backspace, Clear, Copy, and Speak buttons
import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Trash2, Delete, MessageSquare } from 'lucide-react';
import Card from '../common/Card';
import IconButton from '../common/IconButton';
import { useRecognitionContext } from '../../context/RecognitionContext';
import { useSpeech } from '../../hooks/useSpeech';

export default function TextBuilder() {
  const {
    text,
    setText,
    backspaceText,
    clearText
  } = useRecognitionContext();

  const { speak, stop, isSpeaking, supported: speechSupported } = useSpeech();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  return (
    <Card
      title="Text Builder"
      subtitle="Auto-appends recognized letters into words (e.g. C → A → B = CAB)"
      icon={<MessageSquare className="w-4 h-4 text-slate-600" />}
      bodyClassName="p-4 sm:p-5 space-y-3"
    >
      {/* Auto-appended Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.toUpperCase())}
          placeholder="Recognized letters will automatically assemble here (e.g. CAB)…"
          rows={3}
          aria-label="Constructed sign text"
          className="w-full rounded-lg bg-slate-50 border border-slate-200 p-3 font-mono text-base font-medium tracking-wider text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors resize-none shadow-inner"
        />
        {text.length > 0 && (
          <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 font-mono">
            {text.length} chars
          </div>
        )}
      </div>

      {/* Action Button Row: Backspace, Clear, Copy, Speak */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center space-x-1.5">
          <IconButton
            icon={isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            label={isSpeaking ? 'Stop' : 'Speak'}
            variant="primary"
            size="sm"
            onClick={handleSpeak}
            disabled={!speechSupported || !text.trim()}
            title={speechSupported ? 'Speak constructed text' : 'Text-to-speech unsupported in this browser'}
            ariaLabel="Speak text aloud"
          />
          <IconButton
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            label={copied ? 'Copied' : 'Copy'}
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            disabled={!text}
            title="Copy text to clipboard"
            ariaLabel="Copy text to clipboard"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          <IconButton
            icon={<Delete className="w-3.5 h-3.5" />}
            label="Backspace"
            variant="secondary"
            size="sm"
            onClick={backspaceText}
            disabled={!text}
            title="Delete last letter"
            ariaLabel="Delete last letter"
          />
          <IconButton
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Clear"
            variant="secondary"
            size="sm"
            onClick={clearText}
            disabled={!text}
            title="Clear all text"
            ariaLabel="Clear all text"
          />
        </div>
      </div>
    </Card>
  );
}
