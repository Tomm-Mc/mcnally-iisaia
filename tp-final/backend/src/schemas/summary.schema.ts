import { z } from 'zod';

export const sessionSummarySchema = z.object({
  score: z.number().int().min(0).max(100),
  strengths: z.array(z.string().min(1)).length(2),
  improvements: z.array(z.string().min(1)).min(2).max(3),
  tip: z.string().min(1),
});

export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const summaryJsonSchema = {
  name: 'session_summary',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      score: { type: 'integer' },
      strengths: { type: 'array', items: { type: 'string' } },
      improvements: { type: 'array', items: { type: 'string' } },
      tip: { type: 'string' },
    },
    required: ['score', 'strengths', 'improvements', 'tip'],
  },
} as const;
