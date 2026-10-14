import { z } from 'zod';
import { levelSchema } from './enums';

// El email se normaliza (trim + minúsculas) en login y registro para que
// "Ana@Mail.com" y "ana@mail.com" sean la misma cuenta.
const emailSchema = z.string().trim().toLowerCase().pipe(z.string().email('Email inválido'));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(60, 'El nombre es demasiado largo'),
  email: emailSchema,
  // bcrypt sólo usa los primeros 72 bytes: más largo daría una falsa sensación de seguridad.
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar los 72 caracteres'),
  level: levelSchema.default('A2'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
