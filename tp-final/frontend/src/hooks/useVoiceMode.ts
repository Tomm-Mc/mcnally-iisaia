import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { synthesizeSpeech, transcribeAudio } from '../api/speech';
import { MicrophoneSession, type Recording } from '../lib/microphone';
import { SentenceChunker, SpeechPlayer } from '../lib/speechPlayer';

/**
 * - idle: modo voz prendido, esperando que el estudiante toque el micrófono.
 * - listening: grabando; corta solo al detectar silencio.
 * - transcribing: esperando el speech-to-text.
 * - waiting: mensaje enviado, esperando la respuesta del personaje.
 * - speaking: reproduciendo la respuesta con text-to-speech.
 */
export type VoiceStatus = 'idle' | 'listening' | 'transcribing' | 'waiting' | 'speaking';

interface UseVoiceModeParams {
  sessionId: string;
  /** Se llama con el texto transcrito; el componente lo envía como mensaje. */
  onTranscript: (text: string) => void;
}

/**
 * Orquesta el loop conversacional del modo voz:
 * escuchar → transcribir → enviar → hablar la respuesta (por oraciones, a
 * medida que llega el streaming) → volver a escuchar.
 */
export function useVoiceMode({ sessionId, onTranscript }: UseVoiceModeParams) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [level, setLevel] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const enabledRef = useRef(false);
  const micRef = useRef<MicrophoneSession | null>(null);
  const recordingRef = useRef<Recording | null>(null);
  const cancelledRef = useRef(false);
  const playerRef = useRef<SpeechPlayer | null>(null);
  const chunkerRef = useRef(new SentenceChunker());
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const getPlayer = useCallback((): SpeechPlayer => {
    if (!playerRef.current) {
      playerRef.current = new SpeechPlayer((text, signal) => synthesizeSpeech(sessionId, text, signal));
    }
    return playerRef.current;
  }, [sessionId]);

  const cancelRecording = useCallback(() => {
    if (recordingRef.current) {
      cancelledRef.current = true;
      recordingRef.current.cancel();
    }
  }, []);

  const startListening = useCallback(async () => {
    if (recordingRef.current || !micRef.current) return;
    playerRef.current?.stop();
    setNotice(null);
    setStatus('listening');

    cancelledRef.current = false;
    const recording = micRef.current.record({ onLevel: setLevel });
    recordingRef.current = recording;
    const audio = await recording.result;
    recordingRef.current = null;

    if (!audio) {
      if (!cancelledRef.current && enabledRef.current) {
        setNotice('No escuché nada. Tocá el micrófono cuando quieras hablar.');
        setStatus('idle');
      }
      return;
    }

    setStatus('transcribing');
    try {
      const result = await transcribeAudio(sessionId, audio);
      const text = result.text.trim();
      if (!enabledRef.current) return;
      if (!text) {
        setNotice('No te entendí bien. Probá de nuevo, un poco más cerca del micrófono.');
        setStatus('idle');
        return;
      }
      setStatus('waiting');
      if (result.mock) {
        setNotice('Modo demo (sin OpenAI): se envió una frase de ejemplo, no lo que dijiste.');
      }
      onTranscriptRef.current(text);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'No se pudo transcribir el audio. Probá de nuevo.');
      setStatus('idle');
    }
  }, [sessionId]);

  /** Habla un texto completo y, si el modo voz sigue prendido, vuelve a escuchar. */
  const speakThenListen = useCallback(
    async (text: string) => {
      const player = getPlayer();
      player.enqueue(text);
      setStatus('speaking');
      const completed = await player.whenIdle();
      if (completed && enabledRef.current) {
        void startListening();
      }
    },
    [getPlayer, startListening]
  );

  const enable = useCallback(
    async (greeting?: string) => {
      if (enabledRef.current) return;
      setNotice(null);
      if (!MicrophoneSession.isSupported()) {
        // Por HTTP (ej. entrando desde el celular por la IP de la PC) el navegador ni
        // siquiera expone getUserMedia: el problema es la URL, no el dispositivo.
        setNotice(
          window.isSecureContext
            ? 'Tu navegador no permite grabar audio. Probá con Chrome, Edge, Firefox o Safari actualizados.'
            : `El micrófono sólo funciona por HTTPS. Entrá a https://${window.location.hostname}:5443 y aceptá el certificado.`
        );
        return;
      }
      try {
        micRef.current = await MicrophoneSession.open();
      } catch {
        setNotice('No pudimos acceder al micrófono. Revisá los permisos del navegador.');
        return;
      }
      enabledRef.current = true;
      setEnabled(true);
      if (greeting) {
        await speakThenListen(greeting);
      } else {
        void startListening();
      }
    },
    [speakThenListen, startListening]
  );

  const disable = useCallback(() => {
    enabledRef.current = false;
    setEnabled(false);
    cancelRecording();
    playerRef.current?.stop();
    chunkerRef.current.reset();
    micRef.current?.close();
    micRef.current = null;
    setStatus('idle');
    setLevel(0);
    setNotice(null);
  }, [cancelRecording]);

  useEffect(() => disable, [disable]);

  /** Corta la grabación ya (sin esperar el silencio) y la envía. */
  const stopListening = useCallback(() => {
    recordingRef.current?.stop();
  }, []);

  /** Interrumpe al personaje y le pasa el turno al estudiante. */
  const interrupt = useCallback(() => {
    playerRef.current?.stop();
    chunkerRef.current.reset();
    void startListening();
  }, [startListening]);

  const onAssistantToken = useCallback(
    (token: string) => {
      if (!enabledRef.current) return;
      for (const sentence of chunkerRef.current.push(token)) {
        getPlayer().enqueue(sentence);
        setStatus('speaking');
      }
    },
    [getPlayer]
  );

  const onAssistantDone = useCallback(async () => {
    if (!enabledRef.current) return;
    const rest = chunkerRef.current.flush();
    if (rest) {
      await speakThenListen(rest);
      return;
    }
    const completed = await getPlayer().whenIdle();
    if (completed && enabledRef.current) {
      void startListening();
    }
  }, [getPlayer, speakThenListen, startListening]);

  const onAssistantError = useCallback(() => {
    chunkerRef.current.reset();
    playerRef.current?.stop();
    setStatus('idle');
  }, []);

  /** Re-escuchar un mensaje del personaje (funciona con o sin modo voz). */
  const replay = useCallback(
    async (text: string) => {
      cancelRecording();
      const player = getPlayer();
      player.stop();
      player.enqueue(text);
      if (enabledRef.current) setStatus('speaking');
      const completed = await player.whenIdle();
      if (completed && enabledRef.current) setStatus('idle');
    },
    [cancelRecording, getPlayer]
  );

  return {
    enabled,
    status,
    level,
    notice,
    enable,
    disable,
    startListening,
    stopListening,
    interrupt,
    replay,
    onAssistantToken,
    onAssistantDone,
    onAssistantError,
  };
}
