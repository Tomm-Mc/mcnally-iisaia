import { createStructuredCompletion, isMockMode, type ChatMessage } from '../lib/openai';
import { buildCorrectorSystemPrompt, buildCorrectorUserPrompt } from '../prompts/corrector.prompt';
import { correctorJsonSchema, correctorResultSchema, type CorrectionError, type CorrectorResult } from '../schemas/corrector.schema';
import type { Level } from '../schemas/enums';
import type { InputMode } from '../schemas/session.schema';

interface AnalyzeParams {
  lastUserMessage: string;
  previousMessages: { role: 'user' | 'assistant'; content: string }[];
  userLevel: Level;
  inputMode?: InputMode;
}

const FALLBACK_RESULT: CorrectorResult = {
  errors: [],
  correctedMessage: '',
  quality: 'good',
};

/**
 * Analiza el último mensaje del usuario y devuelve errores estructurados.
 * Si la llamada a la IA falla o la respuesta no valida contra el schema,
 * se degrada a "sin errores" para no cortar la conversación (se loguea).
 */
export async function analyzeMessage(params: AnalyzeParams): Promise<CorrectorResult> {
  if (isMockMode) {
    return mockAnalyze(params.lastUserMessage, params.inputMode ?? 'text');
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: buildCorrectorSystemPrompt(params.userLevel, params.inputMode) },
      {
        role: 'user',
        content: buildCorrectorUserPrompt(
          params.lastUserMessage,
          params.previousMessages.slice(-6).map((m) => `${m.role}: ${m.content}`)
        ),
      },
    ];
    const raw = await createStructuredCompletion(messages, correctorJsonSchema);
    const parsed = correctorResultSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('❌ Respuesta del corrector no válida:', parsed.error.flatten());
      return { ...FALLBACK_RESULT, correctedMessage: params.lastUserMessage };
    }
    return parsed.data;
  } catch (err) {
    console.error('❌ Error llamando al corrector de IA:', err);
    return { ...FALLBACK_RESULT, correctedMessage: params.lastUserMessage };
  }
}

interface MockRule {
  pattern: RegExp;
  category: CorrectionError['category'];
  corrected: (match: RegExpMatchArray, original: string) => string;
  explanation: string;
}

const MOCK_RULES: MockRule[] = [
  {
    pattern: /\bi have (\d{1,3}) years?\b/i,
    category: 'vocabulary',
    corrected: (m, original) => original.replace(m[0], `I am ${m[1]} years old`),
    explanation: 'En inglés la edad se expresa con "to be" ("I am X years old"), no con "to have".',
  },
  {
    pattern: /\barrive to\b/i,
    category: 'prepositions',
    corrected: (m, original) => original.replace(m[0], 'arrive at'),
    explanation: 'El verbo "arrive" se usa con la preposición "at" (o "in" para ciudades/países), no "to".',
  },
  {
    pattern: /\bi am (waiter|teacher|doctor|engineer|student|nurse|chef)\b/i,
    category: 'articles',
    corrected: (m, original) => original.replace(m[0], `I am a ${m[1]}`),
    explanation: 'Antes de una profesión en singular hace falta el artículo "a"/"an".',
  },
  {
    pattern: /\b(childs|persons|informations|peoples)\b/i,
    category: 'plurals',
    corrected: (m, original) => {
      const map: Record<string, string> = {
        childs: 'children',
        persons: 'people',
        informations: 'information',
        peoples: 'people',
      };
      return original.replace(m[0], map[m[1].toLowerCase()] ?? m[1]);
    },
    explanation: 'Es un plural irregular o una palabra incontable que no lleva "-s" en inglés.',
  },
  {
    pattern: /\bi go (yesterday|last night|last week)\b/i,
    category: 'verb_tense',
    corrected: (m, original) => original.replace(m[0], `I went ${m[1]}`),
    explanation: 'Con expresiones de tiempo pasado ("yesterday", "last week") hay que usar el pasado simple.',
  },
  {
    pattern: /\brecieve\b/i,
    category: 'spelling',
    corrected: (m, original) => original.replace(m[0], 'receive'),
    explanation: '"Receive" se escribe con "e" antes de "i": regla "i antes de e, excepto después de c".',
  },
];

function mockAnalyze(message: string, inputMode: InputMode): CorrectorResult {
  const errors: CorrectionError[] = [];
  let correctedMessage = message;

  for (const rule of MOCK_RULES) {
    // En una transcripción la ortografía la pone el STT, no el estudiante.
    if (inputMode === 'voice' && rule.category === 'spelling') continue;
    const match = message.match(rule.pattern);
    if (match) {
      const correctedFragment = rule.corrected(match, match[0]);
      errors.push({
        original: match[0],
        corrected: correctedFragment,
        category: rule.category,
        explanation: rule.explanation,
      });
      correctedMessage = rule.corrected(match, correctedMessage);
    }
  }

  const quality = errors.length === 0 ? 'excellent' : errors.length === 1 ? 'good' : 'needs_work';

  return { errors, correctedMessage, quality };
}
