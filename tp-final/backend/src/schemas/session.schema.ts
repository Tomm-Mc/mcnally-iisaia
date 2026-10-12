import { z } from 'zod';

export const createSessionSchema = z.object({
  scenarioId: z.string().min(1, 'scenarioId es obligatorio'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(1000, 'Mensaje demasiado largo'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
