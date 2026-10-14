import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('file:./data/dev.db'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET debe tener al menos 8 caracteres'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_STT_MODEL: z.string().default('gpt-4o-mini-transcribe'),
  OPENAI_TTS_MODEL: z.string().default('gpt-4o-mini-tts'),
  AI_MOCK_MODE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  DAILY_MESSAGE_LIMIT: z.coerce.number().default(60),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isMockMode = env.AI_MOCK_MODE || !env.OPENAI_API_KEY;
