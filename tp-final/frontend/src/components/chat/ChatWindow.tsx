import { useEffect, useRef, useState } from 'react';
import type { InputMode, Message, Scenario } from '../../api/types';
import { streamMessage } from '../../api/sessions';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { VoicePanel } from './VoicePanel';
import { useVoiceMode } from '../../hooks/useVoiceMode';
import { useAuth } from '../../context/AuthContext';

interface ChatWindowProps {
  sessionId: string;
  scenario: Scenario;
  initialMessages: Message[];
  disabled?: boolean;
}

let tempIdCounter = 0;

export function ChatWindow({ sessionId, scenario, initialMessages, disabled }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingText, setStreamingText] = useState('');
  const [isCheckingCorrection, setIsCheckingCorrection] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { refreshUser } = useAuth();
  const voice = useVoiceMode({ sessionId, onTranscript: (text) => handleSend(text, 'voice') });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isCheckingCorrection]);

  useEffect(() => {
    if (xpToast === null) return;
    const t = setTimeout(() => setXpToast(null), 1800);
    return () => clearTimeout(t);
  }, [xpToast]);

  async function handleSend(content: string, inputMode: InputMode = 'text') {
    setError(null);
    tempIdCounter += 1;
    const tempId = `temp-${tempIdCounter}`;
    const optimisticMessage: Message = {
      id: tempId,
      sessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      corrections: [],
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setIsCheckingCorrection(true);

    await streamMessage(sessionId, content, {
      onCorrection: (payload) => {
        setIsCheckingCorrection(false);
        setIsStreaming(true);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  corrections: payload.errors.map((e, i) => ({
                    ...e,
                    id: `${tempId}-correction-${i}`,
                    messageId: tempId,
                    createdAt: new Date().toISOString(),
                  })),
                }
              : m
          )
        );
      },
      onToken: (token) => {
        setStreamingText((prev) => prev + token);
        voice.onAssistantToken(token);
      },
      onDone: (payload) => {
        setIsStreaming(false);
        setStreamingText('');
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempId),
          payload.userMessage,
          payload.assistantMessage,
        ]);
        if (payload.xpEarned > 0) {
          setXpToast(payload.xpEarned);
          refreshUser();
        }
        void voice.onAssistantDone();
      },
      onError: (message) => {
        setIsCheckingCorrection(false);
        setIsStreaming(false);
        setStreamingText('');
        setError(message);
        voice.onAssistantError();
      },
    }, inputMode);
  }

  function handleStartVoice() {
    // Al entrar al modo voz, el personaje lee su último mensaje y después escucha.
    const last = messages[messages.length - 1];
    void voice.enable(last?.role === 'assistant' ? last.content : undefined);
  }

  return (
    <div className="relative flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-brand-bg md:h-[calc(100vh-6rem)]">
      {xpToast !== null && (
        <div className="pointer-events-none absolute right-4 top-4 z-10 animate-bounce rounded-full bg-brand-secondary px-3 py-1 text-sm font-bold text-white shadow-md">
          +{xpToast} XP
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <MessageBubble
            // Se usa el índice (y no message.id) como key a propósito: el mensaje
            // optimista tiene un id temporal que cambia al real cuando llega el
            // evento "done", y con message.id como key React desmontaría la
            // burbuja y perdería el estado "expanded" de las correcciones justo
            // en ese momento. Los mensajes sólo se agregan (nunca se reordenan),
            // así que el índice es una key estable.
            key={index}
            message={message}
            characterName={scenario.characterName}
            isCheckingCorrection={isCheckingCorrection && message.role === 'user' && message === messages[messages.length - 1]}
            onSpeak={message.role === 'assistant' ? () => void voice.replay(message.content) : undefined}
          />
        ))}

        {isStreaming && (
          <MessageBubble
            message={{
              id: 'streaming',
              sessionId,
              role: 'assistant',
              content: streamingText || '...',
              createdAt: new Date().toISOString(),
            }}
            characterName={scenario.characterName}
          />
        )}

        {error && <p className="text-center text-sm font-semibold text-brand-error">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {voice.enabled && !disabled && (
        <VoicePanel
          status={voice.status}
          level={voice.level}
          notice={voice.notice}
          characterName={scenario.characterName}
          onStartListening={() => void voice.startListening()}
          onStopListening={voice.stopListening}
          onInterrupt={voice.interrupt}
          onClose={voice.disable}
        />
      )}

      {!voice.enabled && voice.notice && (
        <p className="bg-white px-4 pt-2 text-center text-xs font-semibold text-brand-error">{voice.notice}</p>
      )}

      <ChatInput
        onSend={(content) => handleSend(content)}
        disabled={
          disabled ||
          isCheckingCorrection ||
          isStreaming ||
          voice.status === 'listening' ||
          voice.status === 'transcribing'
        }
        // Se muestra aunque el navegador no pueda grabar: al tocarlo, el hook explica por qué.
        onStartVoice={!voice.enabled && !disabled ? handleStartVoice : undefined}
      />
    </div>
  );
}
