import { z } from 'zod';

// Query de GET /api/admin/activity
export const activityQuerySchema = z.object({
  days: z.coerce.number().int().min(7, 'Mínimo 7 días').max(90, 'Máximo 90 días').default(30),
});

// Query de GET /api/admin/logins
export const loginsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200, 'Máximo 200 registros').default(50),
});
