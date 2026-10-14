import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { createSessionSchema, sendMessageSchema } from '../schemas/session.schema';
import { answerExerciseSchema } from '../schemas/exercise.schema';
import { correctorResultSchema } from '../schemas/corrector.schema';

describe('auth.schema', () => {
  it('acepta un login válido', () => {
    const result = loginSchema.safeParse({ email: 'ana@charla.dev', password: 'charla123' });
    expect(result.success).toBe(true);
  });

  it('rechaza un email inválido', () => {
    const result = loginSchema.safeParse({ email: 'no-es-un-email', password: 'charla123' });
    expect(result.success).toBe(false);
  });

  it('rechaza una contraseña vacía', () => {
    const result = loginSchema.safeParse({ email: 'ana@charla.dev', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = { name: 'Lucía', email: 'lucia@mail.com', password: 'secreta123', level: 'B1' };

  it('acepta un registro válido y normaliza el email', () => {
    const result = registerSchema.safeParse({ ...valid, email: '  Lucia@Mail.COM ' });
    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBe('lucia@mail.com');
  });

  it('usa A2 como nivel por defecto', () => {
    const { level: _level, ...withoutLevel } = valid;
    const result = registerSchema.safeParse(withoutLevel);
    expect(result.success && result.data.level).toBe('A2');
  });

  it('rechaza contraseñas de menos de 8 caracteres', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'corta' }).success).toBe(false);
  });

  it('rechaza un email inválido, un nombre vacío o un nivel inexistente', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'no-es-email' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, name: ' ' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, level: 'C1' }).success).toBe(false);
  });

  it('no permite elegir el rol (siempre se crea un estudiante)', () => {
    const result = registerSchema.safeParse({ ...valid, role: 'admin' });
    expect(result.success && 'role' in result.data).toBe(false);
  });
});

describe('session.schema', () => {
  it('createSessionSchema requiere scenarioId', () => {
    expect(createSessionSchema.safeParse({}).success).toBe(false);
    expect(createSessionSchema.safeParse({ scenarioId: 'abc123' }).success).toBe(true);
  });

  it('sendMessageSchema rechaza mensajes vacíos o demasiado largos', () => {
    expect(sendMessageSchema.safeParse({ content: '' }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ content: 'Hello there!' }).success).toBe(true);
    expect(sendMessageSchema.safeParse({ content: 'a'.repeat(1001) }).success).toBe(false);
  });
});

describe('exercise.schema', () => {
  it('answerExerciseSchema requiere una respuesta no vacía', () => {
    expect(answerExerciseSchema.safeParse({ answer: '' }).success).toBe(false);
    expect(answerExerciseSchema.safeParse({ answer: 'went' }).success).toBe(true);
  });
});

describe('corrector.schema', () => {
  it('acepta una respuesta válida del corrector', () => {
    const result = correctorResultSchema.safeParse({
      errors: [
        {
          original: 'I go yesterday',
          corrected: 'I went yesterday',
          category: 'verb_tense',
          explanation: 'Con "yesterday" hay que usar el pasado simple.',
        },
      ],
      correctedMessage: 'I went yesterday.',
      quality: 'good',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza una categoría de error inexistente', () => {
    const result = correctorResultSchema.safeParse({
      errors: [
        {
          original: 'x',
          corrected: 'y',
          category: 'not_a_real_category',
          explanation: 'z',
        },
      ],
      correctedMessage: 'y',
      quality: 'good',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza un quality inválido', () => {
    const result = correctorResultSchema.safeParse({
      errors: [],
      correctedMessage: 'Hello.',
      quality: 'perfect',
    });
    expect(result.success).toBe(false);
  });
});
