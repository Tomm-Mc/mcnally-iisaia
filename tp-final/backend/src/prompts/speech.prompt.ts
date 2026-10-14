import type { Level } from '../schemas/enums';

/**
 * Prompt para el modelo de speech-to-text. Va en inglés porque condiciona el
 * estilo de la transcripción (el modelo lo toma como "texto previo"). Lo clave
 * es pedir transcripción literal: si el STT "arregla" la gramática del
 * estudiante, el corrector no tiene nada que corregir y se pierde el feedback.
 */
export function buildTranscriptionPrompt(lastAssistantLine: string | null): string {
  const context = lastAssistantLine ? ` The conversation partner just said: "${lastAssistantLine}"` : '';
  return `The speaker is a Spanish-speaking English learner practicing a conversation.${context} Transcribe exactly what the speaker says, verbatim, keeping every grammatical mistake, wrong word and false start. Do not correct, improve or translate anything.`;
}

const PACE_BY_LEVEL: Record<Level, string> = {
  A2: 'Speak slowly and very clearly, with short pauses between sentences, because the listener is a beginner (A2).',
  B1: 'Speak at a relaxed, slightly slower than normal pace, clearly articulated, for an intermediate learner (B1).',
  B2: 'Speak at a natural conversational pace for an upper-intermediate learner (B2).',
};

interface CharacterForSpeech {
  characterName: string;
  characterRole: string;
}

/**
 * Instrucciones de estilo para el TTS (sólo modelos gpt-4o-*-tts). Hace que el
 * personaje suene como alguien real en ese rol y ajusta el ritmo al nivel.
 */
export function buildSpeechInstructions(character: CharacterForSpeech, userLevel: Level): string {
  return `You are ${character.characterName}, a native English speaker playing this role (described in Spanish): "${character.characterRole}". Sound warm, natural and conversational, like a real person in that situation, never robotic. ${PACE_BY_LEVEL[userLevel]}`;
}
