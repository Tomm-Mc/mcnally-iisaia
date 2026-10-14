import { z } from 'zod';

export const synthesizeSpeechSchema = z.object({
  text: z.string().trim().min(1, 'El texto no puede estar vacío').max(1000, 'Texto demasiado largo'),
});

export type SynthesizeSpeechInput = z.infer<typeof synthesizeSpeechSchema>;
