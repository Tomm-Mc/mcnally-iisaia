import { createStructuredCompletion, isMockMode, type ChatMessage } from '../lib/openai';
import { buildExerciseEvaluationPrompt, buildExerciseGenerationPrompt } from '../prompts/exercise.prompt';
import {
  exerciseEvaluationJsonSchema,
  exerciseEvaluationSchema,
  exerciseGenerationJsonSchema,
  exerciseGenerationSchema,
  type ExerciseEvaluation,
  type GeneratedExercise,
} from '../schemas/exercise.schema';
import type { ErrorCategory, Level } from '../schemas/enums';

interface ExampleError {
  original: string;
  corrected: string;
  category: ErrorCategory;
}

const MOCK_TEMPLATES: Record<ErrorCategory, GeneratedExercise[]> = {
  verb_tense: [
    {
      category: 'verb_tense',
      type: 'fill_blank',
      prompt: 'Completá el espacio con el verbo en el tiempo correcto.',
      sentence: 'Yesterday, I ___ (go) to the supermarket.',
      expectedAnswer: 'went',
    },
    {
      category: 'verb_tense',
      type: 'fix_sentence',
      prompt: 'Corregí el error de tiempo verbal en la oración.',
      sentence: 'She go to work every day by bus.',
      expectedAnswer: 'She goes to work every day by bus.',
    },
  ],
  prepositions: [
    {
      category: 'prepositions',
      type: 'fill_blank',
      prompt: 'Completá con la preposición correcta.',
      sentence: 'The plane arrives ___ the airport at 6pm.',
      expectedAnswer: 'at',
    },
  ],
  articles: [
    {
      category: 'articles',
      type: 'fix_sentence',
      prompt: 'Agregá el artículo que falta.',
      sentence: 'I am waiter in a restaurant.',
      expectedAnswer: 'I am a waiter in a restaurant.',
    },
  ],
  word_order: [
    {
      category: 'word_order',
      type: 'fix_sentence',
      prompt: 'Reordená la oración correctamente.',
      sentence: 'Always I drink coffee in the morning.',
      expectedAnswer: 'I always drink coffee in the morning.',
    },
  ],
  vocabulary: [
    {
      category: 'vocabulary',
      type: 'translate',
      prompt: 'Traducí al inglés.',
      sentence: 'Tengo 25 años.',
      expectedAnswer: 'I am 25 years old.',
    },
  ],
  spelling: [
    {
      category: 'spelling',
      type: 'fix_sentence',
      prompt: 'Corregí el error de ortografía.',
      sentence: 'I will recieve the package tomorrow.',
      expectedAnswer: 'I will receive the package tomorrow.',
    },
  ],
  plurals: [
    {
      category: 'plurals',
      type: 'fix_sentence',
      prompt: 'Corregí el plural incorrecto.',
      sentence: 'There are many childs in the park.',
      expectedAnswer: 'There are many children in the park.',
    },
  ],
  pronouns: [
    {
      category: 'pronouns',
      type: 'fill_blank',
      prompt: 'Completá con el pronombre correcto.',
      sentence: '___ is my brother. ___ is a doctor.',
      expectedAnswer: 'He, He',
    },
  ],
  other: [
    {
      category: 'other',
      type: 'translate',
      prompt: 'Traducí al inglés.',
      sentence: '¿Podés ayudarme, por favor?',
      expectedAnswer: 'Can you help me, please?',
    },
  ],
};

function mockGenerate(categories: ErrorCategory[]): GeneratedExercise[] {
  const allCategories = Object.keys(MOCK_TEMPLATES) as ErrorCategory[];
  const priorityCategories = categories.length > 0 ? categories : allCategories;
  // Prioriza las categorías débiles, pero completa con el resto para no repetir
  // el mismo ejercicio 5 veces cuando el usuario sólo tiene 1 o 2 debilidades.
  const orderedCategories = [...priorityCategories, ...allCategories.filter((c) => !priorityCategories.includes(c))];

  const exercises: GeneratedExercise[] = [];
  for (const category of orderedCategories) {
    for (const template of MOCK_TEMPLATES[category]) {
      if (exercises.length >= 5) break;
      exercises.push(template);
    }
    if (exercises.length >= 5) break;
  }
  return exercises;
}

/** Genera 5 ejercicios enfocados en las categorías más débiles del usuario. */
export async function generateExercises(
  categories: ErrorCategory[],
  exampleErrors: ExampleError[],
  userLevel: Level
): Promise<GeneratedExercise[]> {
  if (isMockMode) {
    return mockGenerate(categories);
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'Sos un generador de ejercicios de inglés. Respondés únicamente en JSON.' },
      { role: 'user', content: buildExerciseGenerationPrompt(categories, exampleErrors, userLevel) },
    ];
    const raw = await createStructuredCompletion(messages, exerciseGenerationJsonSchema);
    const parsed = exerciseGenerationSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('❌ Respuesta de generación de ejercicios no válida:', parsed.error.flatten());
      return mockGenerate(categories);
    }
    return parsed.data.exercises;
  } catch (err) {
    console.error('❌ Error generando ejercicios con IA:', err);
    return mockGenerate(categories);
  }
}

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Evalúa la respuesta de un ejercicio: primero comparación normalizada;
 * si no coincide, la IA (o una heurística mock) decide si es equivalente.
 */
export async function evaluateAnswer(
  exerciseSentence: string,
  expectedAnswer: string,
  userAnswer: string
): Promise<ExerciseEvaluation> {
  if (normalize(userAnswer) === normalize(expectedAnswer)) {
    return { isCorrect: true, feedback: '¡Correcto! Coincide exactamente con la respuesta esperada.' };
  }

  if (isMockMode) {
    return mockEvaluate(expectedAnswer, userAnswer);
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'Sos un evaluador de respuestas de ejercicios de inglés. Respondés únicamente en JSON.' },
      { role: 'user', content: buildExerciseEvaluationPrompt(exerciseSentence, expectedAnswer, userAnswer) },
    ];
    const raw = await createStructuredCompletion(messages, exerciseEvaluationJsonSchema);
    const parsed = exerciseEvaluationSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('❌ Respuesta de evaluación de ejercicio no válida:', parsed.error.flatten());
      return mockEvaluate(expectedAnswer, userAnswer);
    }
    return parsed.data;
  } catch (err) {
    console.error('❌ Error evaluando ejercicio con IA:', err);
    return mockEvaluate(expectedAnswer, userAnswer);
  }
}

function mockEvaluate(expectedAnswer: string, userAnswer: string): ExerciseEvaluation {
  const expectedWords = new Set(normalize(expectedAnswer).split(' '));
  const userWords = new Set(normalize(userAnswer).split(' '));
  const overlap = [...expectedWords].filter((w) => userWords.has(w)).length;
  const similarity = overlap / Math.max(expectedWords.size, 1);

  if (similarity >= 0.6) {
    return { isCorrect: true, feedback: 'Tu respuesta es equivalente a la esperada. ¡Bien hecho!' };
  }
  return {
    isCorrect: false,
    feedback: `No es correcto. La respuesta esperada era: "${expectedAnswer}".`,
  };
}
