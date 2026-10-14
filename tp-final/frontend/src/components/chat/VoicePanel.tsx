import { Mic, Square, Volume2, X } from 'lucide-react';
import type { VoiceStatus } from '../../hooks/useVoiceMode';
import { Spinner } from '../ui/Spinner';

interface VoicePanelProps {
  status: VoiceStatus;
  level: number;
  notice: string | null;
  characterName: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onInterrupt: () => void;
  onClose: () => void;
}

export function VoicePanel({
  status,
  level,
  notice,
  characterName,
  onStartListening,
  onStopListening,
  onInterrupt,
  onClose,
}: VoicePanelProps) {
  const label: Record<VoiceStatus, string> = {
    idle: 'Tocá el micrófono para hablar',
    listening: 'Te escucho... hacé una pausa cuando termines',
    transcribing: 'Transcribiendo lo que dijiste...',
    waiting: `${characterName} está pensando...`,
    speaking: `${characterName} está hablando · tocá para interrumpir`,
  };

  return (
    <div className="flex items-center gap-4 border-t border-slate-200 bg-white px-4 py-3" aria-live="polite">
      <MainButton
        status={status}
        level={level}
        onStartListening={onStartListening}
        onStopListening={onStopListening}
        onInterrupt={onInterrupt}
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-text">{label[status]}</p>
        {notice ? (
          <p className="text-xs font-semibold text-brand-error">{notice}</p>
        ) : (
          <p className="text-xs text-slate-400">Modo voz · hablá en inglés con naturalidad</p>
        )}
      </div>

      <button
        onClick={onClose}
        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-text"
        aria-label="Salir del modo voz"
        title="Salir del modo voz"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}

interface MainButtonProps {
  status: VoiceStatus;
  level: number;
  onStartListening: () => void;
  onStopListening: () => void;
  onInterrupt: () => void;
}

function MainButton({ status, level, onStartListening, onStopListening, onInterrupt }: MainButtonProps) {
  const base =
    'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  if (status === 'listening') {
    return (
      <button
        onClick={onStopListening}
        className={`${base} bg-brand-error focus-visible:ring-brand-error`}
        aria-label="Terminar de hablar y enviar"
      >
        {/* Anillo que crece con el volumen del micrófono. */}
        <span
          className="absolute inset-0 rounded-full bg-brand-error/30 transition-transform duration-75"
          style={{ transform: `scale(${1 + level * 0.6})` }}
          aria-hidden="true"
        />
        <Square className="relative h-5 w-5 fill-current" aria-hidden="true" />
      </button>
    );
  }

  if (status === 'speaking') {
    return (
      <button
        onClick={onInterrupt}
        className={`${base} animate-pulse bg-brand-secondary focus-visible:ring-brand-secondary`}
        aria-label="Interrumpir y hablar"
      >
        <Volume2 className="h-6 w-6" aria-hidden="true" />
      </button>
    );
  }

  if (status === 'transcribing' || status === 'waiting') {
    return (
      <div className={`${base} bg-violet-100`} aria-hidden="true">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <button
      onClick={onStartListening}
      className={`${base} bg-brand-primary hover:bg-violet-700 focus-visible:ring-brand-primary`}
      aria-label="Hablar"
    >
      <Mic className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
