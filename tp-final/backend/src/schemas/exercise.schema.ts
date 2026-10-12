import { z } from 'zod';
import { errorCategorySchema, exerciseTypeSchema } from './enums';

// Body de POST /api/exercises/:id/answer
export const answerExerciseSchema = z.object({
  answer: z.string().min(1, 'La respuesta no puede estar vacía'),
});

export type AnswerExerciseInput = z.infer<typeof answerExerciseSchema>;

// Un ejercicio individual generado por la IA
export const generatedExerciseSchema = z.object({
  category: errorCategorySchema,
  type: exerciseTypeSchema,
  prompt: z.string().min(1),
  sentence: z.string().min(1),
  expectedAnswer: z.string().min(1),
});

export type GeneratedExercise = z.infer<typeof generatedExerciseSchema>;

// Respuesta completa de generación: 5 ejercicios
export const exerciseGenerationSchema = z.object({
  exercises: z.array(generatedExerciseSchema).length(5),
});

export type ExerciseGeneration = z.infer<typeof exerciseGenerationSchema>;

// Resultado de evaluar una respuesta vía IA (cuando no matchea exacto)
export const exerciseEvaluationSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string().min(1).max(300),
});

export type ExerciseEvaluation = z.infer<typeof exerciseEvaluationSchema>;

const EXERCISE_CATEGORY_ENUM = [
  'verb_tense',
  'prepositions',
  'articles',
  'word_order',
  'vocabulary',
  'spelling',
  'plurals',
  'pronouns',
  'other',
];

export const exerciseGenerationJsonSchema = {
  name: 'exercise_generation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      exercises: {
        type: 'array',
        minItems: 5,
        maxItems: 5,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            category: { type: 'string', enum: EXERCISE_CATEGORY_ENUM },
            type: { type: 'string', enum: ['fill_blank', 'fix_sentence', 'translate'] },
            prompt: { type: 'string' },
            sentence: { type: 'string' },
            expectedAnswer: { type: 'string' },
          },
          required: ['category', 'type', 'prompt', 'sentence', 'expectedAnswer'],
        },
      },
    },
    required: ['exercises'],
  },
} as const;

export const exerciseEvaluationJsonSchema = {
  name: 'exercise_evaluation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      isCorrect: { type: 'boolean' },
      feedback: { type: 'string' },
    },
    required: ['isCorrect', 'feedback'],
  },
} as const;
