import { createStructuredCompletion, isMockMode, type ChatMessage } from '../lib/openai';
import { buildSummaryPrompt } from '../prompts/summary.prompt';
import { summaryJsonSchema, sessionSummarySchema, type SessionSummary } from '../schemas/summary.schema';
import type { ErrorCategory } from '../schemas/enums';
import { CATEGORY_LABELS_ES } from '../schemas/enums';

interface CorrectionForSummary {
  original: string;
  corrected: string;
  category: ErrorCategory;
}

function mockSummary(userMessagesCount: number, corrections: CorrectionForSummary[]): SessionSummary {
  const errorRate = userMessagesCount === 0 ? 0 : corrections.length / userMessagesCount;
  const score = Math.max(40, Math.round(100 - errorRate * 60));

  const topCategories = [...new Set(corrections.map((c) => c.category))].slice(0, 3);
  const improvements =
    topCategories.length > 0
      ? topCategories.map((c) => `Seguí practicando ${CATEGORY_LABELS_ES[c].toLowerCase()}.`)
      : ['Segui practicando para consolidar lo aprendido.', 'Intentá usar oraciones un poco más largas.'];

  return {
    score,
    strengths: [
      'Mantuviste la conversación fluida y respondiste a todas las preguntas.',
      'Usaste vocabulario apropiado para el escenario.',
    ],
    improvements: improvements.length >= 2 ? improvements : [...improvements, 'Prestá atención a la concordancia verbal.'],
    tip: 'Practicá 10 minutos por día conversando sobre temas cotidianos: la constancia es más importante que la duración.',
  };
}

/** Genera el resumen de cierre de una sesión de conversación. */
export async function generateSessionSummary(
  scenarioTitle: string,
  userMessages: string[],
  corrections: CorrectionForSummary[]
): Promise<SessionSummary> {
  if (isMockMode) {
    return mockSummary(userMessages.length, corrections);
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'Sos un tutor de inglés que resume sesiones de práctica. Respondés únicamente en JSON.' },
      { role: 'user', content: buildSummaryPrompt(scenarioTitle, userMessages, corrections) },
    ];
    const raw = await createStructuredCompletion(messages, summaryJsonSchema);
    const parsed = sessionSummarySchema.safeParse(raw);
    if (!parsed.success) {
      console.error('❌ Respuesta de resumen no válida:', parsed.error.flatten());
      return mockSummary(userMessages.length, corrections);
    }
    return parsed.data;
  } catch (err) {
    console.error('❌ Error generando resumen con IA:', err);
    return mockSummary(userMessages.length, corrections);
  }
}
