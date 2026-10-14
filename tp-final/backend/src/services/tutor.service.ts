import { isMockMode, streamChatCompletion, type ChatMessage } from '../lib/openai';
import { buildTutorSystemPrompt } from '../prompts/tutor.prompt';
import type { Level } from '../schemas/enums';

interface ScenarioForTutor {
  title: string;
  characterName: string;
  characterRole: string;
  systemPrompt: string;
  openingLine: string;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TutorParams {
  scenario: ScenarioForTutor;
  userLevel: Level;
  history: HistoryMessage[]; // últimos mensajes, sin incluir el opening line
  spoken?: boolean; // modo voz: la respuesta se va a sintetizar con TTS
}

const MOCK_FOLLOWUPS = [
  "That's interesting! Can you tell me a bit more about that?",
  'Got it. What would you like to do next?',
  'I see. How do you feel about that?',
  "Sure, no problem. Is there anything else I can help you with?",
  'Sounds good! What else is on your mind?',
];

function pickMockReply(history: HistoryMessage[]): string {
  const index = history.length % MOCK_FOLLOWUPS.length;
  return MOCK_FOLLOWUPS[index];
}

/**
 * Devuelve la respuesta del personaje token por token (async generator).
 * En modo mock trocea una respuesta canned con un pequeño delay para
 * simular streaming real. En modo real, delega al streaming del SDK de OpenAI.
 */
export async function* generateTutorReply(params: TutorParams): AsyncGenerator<string> {
  if (isMockMode) {
    const reply = pickMockReply(params.history);
    const words = reply.split(' ');
    for (const word of words) {
      await delay(35);
      yield `${word} `;
    }
    return;
  }

  const systemPrompt = buildTutorSystemPrompt(params.scenario, params.userLevel, params.spoken);
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'assistant', content: params.scenario.openingLine },
    ...params.history.slice(-20).map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
  ];

  yield* streamChatCompletion(messages);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
