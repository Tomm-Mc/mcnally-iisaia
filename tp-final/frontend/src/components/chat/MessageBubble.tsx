import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Message } from '../../api/types';
import { CorrectionCard } from './CorrectionCard';

interface MessageBubbleProps {
  message: Message;
  characterName: string;
  isCheckingCorrection?: boolean;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function MessageBubble({ message, characterName, isCheckingCorrection }: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(false);
  const isUser = message.role === 'user';
  const corrections = message.corrections ?? [];
  const hasErrors = corrections.length > 0;

  if (!isUser) {
    return (
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-brand-primary">
          {initials(characterName)}
        </div>
        <div>
          <p className="mb-0.5 text-xs font-semibold text-slate-400">{characterName}</p>
          <div className="max-w-md rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm shadow-sm">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="max-w-md rounded-2xl rounded-tr-sm bg-brand-primary px-4 py-2.5 text-sm text-white shadow-sm">
        {message.content}
      </div>

      {isCheckingCorrection ? (
        <span className="text-xs text-slate-400">Revisando tu mensaje...</span>
      ) : hasErrors ? (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-brand-error"
          aria-expanded={expanded}
        >
          {corrections.length} {corrections.length === 1 ? 'corrección' : 'correcciones'}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      ) : (
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-secondary">
          <Check className="h-3.5 w-3.5" aria-hidden="true" /> Sin errores
        </span>
      )}

      {expanded && hasErrors && (
        <div className="flex w-full max-w-md flex-col gap-2">
          {corrections.map((c) => (
            <CorrectionCard key={c.id} correction={c} />
          ))}
        </div>
      )}
    </div>
  );
}
