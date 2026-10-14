import { useState, type KeyboardEvent } from 'react';
import { Mic, Send } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  /** Si se pasa, muestra el botón para entrar al modo voz. */
  onStartVoice?: () => void;
}

export function ChatInput({ onSend, disabled, onStartVoice }: ChatInputProps) {
  const [value, setValue] = useState('');

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
      {onStartVoice && (
        <Button
          variant="ghost"
          onClick={onStartVoice}
          disabled={disabled}
          aria-label="Activar modo voz"
          title="Modo voz: charlá hablando"
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Escribí tu respuesta en inglés..."
        aria-label="Mensaje"
        className="max-h-32 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
      />
      <Button onClick={submit} disabled={disabled || !value.trim()} aria-label="Enviar mensaje">
        <Send className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
