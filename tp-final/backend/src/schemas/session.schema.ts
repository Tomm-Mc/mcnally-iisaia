import { z } from 'zod';

export const createSessionSchema = z.object({
  scenarioId: z.string().min(1, 'scenarioId es obligatorio'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(1000, 'Mensaje demasiado largo'),
  // 'voice' = el texto viene de una transcripción (modo voz): cambia cómo corrige
  // el corrector y pide al personaje respuestas aptas para leerse en voz alta.
  inputMode: z.enum(['text', 'voice']).default('text'),
});

export type InputMode = SendMessageInput['inputMode'];

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
