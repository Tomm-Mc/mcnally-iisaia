import { isMockMode, synthesizeSpeech, transcribeAudio } from '../lib/openai';
import { buildSpeechInstructions, buildTranscriptionPrompt } from '../prompts/speech.prompt';
import type { Level } from '../schemas/enums';

interface TranscribeParams {
  audio: Buffer;
  mimeType: string;
  lastAssistantLine: string | null;
}

interface ScenarioForSpeech {
  slug: string;
  characterName: string;
  characterRole: string;
}

interface SynthesizeParams {
  text: string;
  scenario: ScenarioForSpeech;
  userLevel: Level;
}

// Frases con errores típicos para que, en modo mock, el corrector heurístico
// también tenga algo que marcar cuando se usa el modo voz.
const MOCK_TRANSCRIPTS = [
  'Hello! I have 25 years and I am student.',
  'Yes, I arrive to the city yesterday with my childs.',
  'I would like something to drink, please.',
  'I go yesterday to the beach and it was very nice.',
  'Thank you so much, that sounds great.',
];

let mockTranscriptIndex = 0;

// Voz de OpenAI por personaje (escenarios del seed), elegida según el género
// y el tono del rol. Los escenarios nuevos caen en DEFAULT_VOICE.
const VOICE_BY_SCENARIO: Record<string, string> = {
  restaurant: 'ash',
  airport: 'echo',
  'job-interview': 'coral',
  'hotel-checkin': 'verse',
  'doctor-visit': 'sage',
  'office-smalltalk': 'ballad',
  'product-return': 'onyx',
  directions: 'shimmer',
};

const DEFAULT_VOICE = 'alloy';

export function voiceForScenario(slug: string): string {
  return VOICE_BY_SCENARIO[slug] ?? DEFAULT_VOICE;
}

/** El SDK de OpenAI detecta el formato por la extensión, no por el MIME type. */
export function filenameForMimeType(mimeType: string): string {
  const base = mimeType.split(';')[0].trim().toLowerCase();
  const extensions: Record<string, string> = {
    'audio/webm': 'webm',
    'video/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'mp4',
    'audio/x-m4a': 'm4a',
    'audio/m4a': 'm4a',
    'audio/aac': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
  };
  return `speech.${extensions[base] ?? 'webm'}`;
}

/**
 * Speech-to-text del turno del usuario. Devuelve el texto ya recortado, o null
 * si falló la llamada a OpenAI (no hay un fallback razonable para inventar lo
 * que dijo el estudiante, así que la ruta le pide que repita).
 */
export async function transcribeUserAudio(params: TranscribeParams): Promise<string | null> {
  if (isMockMode) {
    const text = MOCK_TRANSCRIPTS[mockTranscriptIndex % MOCK_TRANSCRIPTS.length];
    mockTranscriptIndex += 1;
    return text;
  }

  try {
    const text = await transcribeAudio(
      params.audio,
      filenameForMimeType(params.mimeType),
      buildTranscriptionPrompt(params.lastAssistantLine)
    );
    return text.trim();
  } catch (err) {
    console.error('❌ Error llamando al speech-to-text:', err);
    return null;
  }
}

/**
 * Text-to-speech de una respuesta del personaje. En modo mock (o si falla
 * OpenAI) devuelve null y el frontend cae a la síntesis de voz del navegador
 * (Web Speech API): el modo voz se puede demostrar sin API key y una falla del
 * TTS no corta la conversación.
 */
export async function synthesizeCharacterSpeech(params: SynthesizeParams): Promise<Buffer | null> {
  if (isMockMode) {
    return null;
  }

  try {
    return await synthesizeSpeech(params.text, {
      voice: voiceForScenario(params.scenario.slug),
      instructions: buildSpeechInstructions(params.scenario, params.userLevel),
    });
  } catch (err) {
    console.error('❌ Error llamando al text-to-speech:', err);
    return null;
  }
}
