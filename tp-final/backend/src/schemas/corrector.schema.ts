import { z } from 'zod';
import { errorCategorySchema, qualitySchema } from './enums';

export const correctionErrorSchema = z.object({
  original: z.string().min(1),
  corrected: z.string().min(1),
  category: errorCategorySchema,
  explanation: z.string().min(1).max(200),
});

export type CorrectionError = z.infer<typeof correctionErrorSchema>;

export const correctorResultSchema = z.object({
  errors: z.array(correctionErrorSchema),
  correctedMessage: z.string().min(1),
  quality: qualitySchema,
});

export type CorrectorResult = z.infer<typeof correctorResultSchema>;

// JSON Schema estricto para Structured Outputs de OpenAI (response_format).
export const correctorJsonSchema = {
  name: 'corrector_result',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      errors: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            original: { type: 'string' },
            corrected: { type: 'string' },
            category: {
              type: 'string',
              enum: [
                'verb_tense',
                'prepositions',
                'articles',
                'word_order',
                'vocabulary',
                'spelling',
                'plurals',
                'pronouns',
                'other',
              ],
            },
            explanation: { type: 'string' },
          },
          required: ['original', 'corrected', 'category', 'explanation'],
        },
      },
      correctedMessage: { type: 'string' },
      quality: { type: 'string', enum: ['excellent', 'good', 'needs_work'] },
    },
    required: ['errors', 'correctedMessage', 'quality'],
  },
} as const;
