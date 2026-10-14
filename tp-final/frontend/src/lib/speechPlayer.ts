type Synthesize = (text: string, signal: AbortSignal) => Promise<Blob | null>;

interface QueueItem {
  text: string;
  audio: Promise<Blob | null>;
}

// Las oraciones muy cortas ("Sure!") se juntan con la siguiente: cada fragmento
// es una llamada al TTS y cortes tan chicos suenan entrecortados.
const MIN_CHUNK_LENGTH = 25;

/**
 * Arma oraciones completas a partir de los tokens del streaming, para empezar
 * a sintetizar la primera oración mientras el modelo sigue escribiendo.
 */
export class SentenceChunker {
  private buffer = '';

  push(token: string): string[] {
    this.buffer += token;
    const sentences: string[] = [];
    const boundary = /[.!?]+["')\]]?\s+/g;
    let start = 0;
    let match: RegExpExecArray | null;
    while ((match = boundary.exec(this.buffer)) !== null) {
      const end = match.index + match[0].length;
      const candidate = this.buffer.slice(start, end).trim();
      if (candidate.length >= MIN_CHUNK_LENGTH) {
        sentences.push(candidate);
        start = end;
      }
    }
    this.buffer = this.buffer.slice(start);
    return sentences;
  }

  flush(): string {
    const rest = this.buffer.trim();
    this.buffer = '';
    return rest;
  }

  reset(): void {
    this.buffer = '';
  }
}

/**
 * Cola de reproducción de TTS: pide el audio de cada fragmento apenas se
 * encola (en paralelo) pero los reproduce en orden. Si el backend no devuelve
 * audio (modo mock) o falla, usa la voz del navegador para no cortar la charla.
 */
export class SpeechPlayer {
  private queue: QueueItem[] = [];
  private draining: Promise<boolean> | null = null;
  private controller = new AbortController();
  private generation = 0;
  private interrupt: (() => void) | null = null;

  constructor(private readonly synthesize: Synthesize) {}

  enqueue(text: string): void {
    const signal = this.controller.signal;
    const audio = this.synthesize(text, signal).catch((err: unknown) => {
      if (!signal.aborted) console.warn('No se pudo sintetizar con OpenAI, uso la voz del navegador:', err);
      return null;
    });
    this.queue.push({ text, audio });
    if (!this.draining) {
      this.draining = this.drain(this.generation);
    }
  }

  /** Resuelve true cuando terminó de hablar todo, o false si se interrumpió con stop(). */
  whenIdle(): Promise<boolean> {
    return this.draining ?? Promise.resolve(true);
  }

  stop(): void {
    this.generation += 1;
    this.controller.abort();
    this.controller = new AbortController();
    this.queue = [];
    this.draining = null;
    this.interrupt?.();
  }

  private async drain(generation: number): Promise<boolean> {
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift()!;
        const blob = await item.audio;
        if (generation !== this.generation) return false;
        await (blob ? this.playBlob(blob) : this.speakWithBrowser(item.text));
        if (generation !== this.generation) return false;
      }
      return true;
    } finally {
      if (generation === this.generation) this.draining = null;
    }
  }

  private playBlob(blob: Blob): Promise<void> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        URL.revokeObjectURL(url);
        this.interrupt = null;
        resolve();
      };
      this.interrupt = () => {
        audio.pause();
        finish();
      };
      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch(finish);
    });
  }

  private speakWithBrowser(text: string): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'));
      if (voice) utterance.voice = voice;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        this.interrupt = null;
        resolve();
      };
      this.interrupt = () => {
        window.speechSynthesis.cancel();
        finish();
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    });
  }
}
