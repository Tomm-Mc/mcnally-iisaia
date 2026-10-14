// Formatos en orden de preferencia: Chrome/Firefox graban webm/opus, Safari mp4.
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

export interface RecordOptions {
  /** Nivel de volumen normalizado (0-1), para dibujar el medidor. */
  onLevel?: (level: number) => void;
  /** Silencio, después de haber hablado, que se toma como fin del turno. */
  silenceMs?: number;
  /** Corte duro por si nunca hay un silencio claro. */
  maxMs?: number;
  /** Si no se detecta voz en este tiempo, se descarta la grabación. */
  noSpeechMs?: number;
}

export interface Recording {
  /** Audio grabado, o null si se canceló o no se detectó voz. */
  result: Promise<Blob | null>;
  /** Corta y devuelve el audio grabado hasta ahora. */
  stop: () => void;
  /** Corta y descarta el audio. */
  cancel: () => void;
}

/**
 * Micrófono abierto durante todo el modo voz (se pide permiso una sola vez) con
 * detección de fin de turno por silencio: así la charla fluye sin tener que
 * apretar un botón para cortar cada vez que el estudiante termina de hablar.
 */
export class MicrophoneSession {
  private readonly context: AudioContext;
  private readonly analyser: AnalyserNode;

  static isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined' &&
      typeof AudioContext !== 'undefined'
    );
  }

  static async open(): Promise<MicrophoneSession> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    return new MicrophoneSession(stream);
  }

  private constructor(private readonly stream: MediaStream) {
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.context.createMediaStreamSource(stream).connect(this.analyser);
  }

  record({ onLevel, silenceMs = 1300, maxMs = 30000, noSpeechMs = 8000 }: RecordOptions = {}): Recording {
    void this.context.resume();

    const mimeType = MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    const samples = new Float32Array(this.analyser.fftSize);
    const startedAt = performance.now();
    let lastVoiceAt = startedAt;
    let heardSpeech = false;
    let noiseFloor = 0.005;
    let keepAudio = true;
    let resolveResult: (audio: Blob | null) => void = () => {};
    const result = new Promise<Blob | null>((resolve) => {
      resolveResult = resolve;
    });

    const finish = (keep: boolean) => {
      if (recorder.state === 'inactive') return;
      keepAudio = keep;
      recorder.stop();
    };

    // setInterval y no requestAnimationFrame: rAF se pausa si la pestaña queda en segundo plano.
    const timer = window.setInterval(() => {
      this.analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += sample * sample;
      const rms = Math.sqrt(sum / samples.length);
      onLevel?.(Math.min(1, rms * 10));

      const now = performance.now();
      const elapsed = now - startedAt;
      // Los primeros 300 ms calibran el ruido ambiente para no confundirlo con voz.
      if (elapsed < 300) {
        noiseFloor = Math.min(0.04, Math.max(noiseFloor, rms));
        return;
      }

      if (rms > Math.max(0.015, noiseFloor * 2.5)) {
        heardSpeech = true;
        lastVoiceAt = now;
      }

      if (heardSpeech && now - lastVoiceAt > silenceMs) finish(true);
      else if (!heardSpeech && elapsed > noSpeechMs) finish(false);
      else if (elapsed > maxMs) finish(true);
    }, 50);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      window.clearInterval(timer);
      onLevel?.(0);
      const type = recorder.mimeType || mimeType || 'audio/webm';
      resolveResult(keepAudio && chunks.length > 0 ? new Blob(chunks, { type }) : null);
    };

    recorder.start(250);

    return { result, stop: () => finish(true), cancel: () => finish(false) };
  }

  close(): void {
    this.stream.getTracks().forEach((track) => track.stop());
    void this.context.close();
  }
}
