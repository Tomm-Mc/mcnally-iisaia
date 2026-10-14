import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mockeamos lib/openai para simular modo "real" sin llamar a la API.
vi.mock('../lib/openai', () => ({
  isMockMode: false,
  transcribeAudio: vi.fn(),
  synthesizeSpeech: vi.fn(),
}));

import { synthesizeSpeech, transcribeAudio } from '../lib/openai';
import {
  filenameForMimeType,
  synthesizeCharacterSpeech,
  transcribeUserAudio,
  voiceForScenario,
} from '../services/speech.service';

const mockedTranscribe = vi.mocked(transcribeAudio);
const mockedSynthesize = vi.mocked(synthesizeSpeech);

describe('speech.service', () => {
  beforeEach(() => {
    mockedTranscribe.mockReset();
    mockedSynthesize.mockReset();
  });

  it('mapea el MIME type de MediaRecorder a una extensión que OpenAI reconoce', () => {
    expect(filenameForMimeType('audio/webm;codecs=opus')).toBe('speech.webm');
    expect(filenameForMimeType('audio/mp4')).toBe('speech.mp4');
    expect(filenameForMimeType('audio/ogg; codecs=opus')).toBe('speech.ogg');
    expect(filenameForMimeType('application/octet-stream')).toBe('speech.webm');
  });

  it('transcribe pidiendo literalidad y con el último mensaje del personaje como contexto', async () => {
    mockedTranscribe.mockResolvedValue('  I have 25 years.  ');

    const text = await transcribeUserAudio({
      audio: Buffer.from('fake-audio'),
      mimeType: 'audio/webm;codecs=opus',
      lastAssistantLine: 'How old are you?',
    });

    expect(text).toBe('I have 25 years.');
    const [, filename, prompt] = mockedTranscribe.mock.calls[0];
    expect(filename).toBe('speech.webm');
    expect(prompt).toContain('verbatim');
    expect(prompt).toContain('How old are you?');
  });

  it('sintetiza con la voz del personaje y ritmo según el nivel', async () => {
    mockedSynthesize.mockResolvedValue(Buffer.from('mp3'));

    const audio = await synthesizeCharacterSpeech({
      text: 'Welcome! Table for one?',
      scenario: { slug: 'restaurant', characterName: 'Jamie', characterRole: 'un mozo' },
      userLevel: 'A2',
    });

    expect(audio?.toString()).toBe('mp3');
    const [text, options] = mockedSynthesize.mock.calls[0];
    expect(text).toBe('Welcome! Table for one?');
    expect(options.voice).toBe('ash');
    expect(options.instructions).toContain('Jamie');
    expect(options.instructions).toContain('slowly');
  });

  it('devuelve null (la ruta pide repetir) si falla el speech-to-text', async () => {
    mockedTranscribe.mockRejectedValue(new Error('OpenAI timeout'));

    const text = await transcribeUserAudio({ audio: Buffer.from('x'), mimeType: 'audio/webm', lastAssistantLine: null });

    expect(text).toBeNull();
  });

  it('devuelve null (voz del navegador) si falla el text-to-speech, sin cortar la charla', async () => {
    mockedSynthesize.mockRejectedValue(new Error('quota exceeded'));

    const audio = await synthesizeCharacterSpeech({
      text: 'Hi!',
      scenario: { slug: 'airport', characterName: 'Alex', characterRole: 'un agente' },
      userLevel: 'B2',
    });

    expect(audio).toBeNull();
  });

  it('usa una voz por defecto para escenarios sin voz asignada', () => {
    expect(voiceForScenario('escenario-nuevo')).toBe('alloy');
  });
});
