import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mockeamos lib/openai para simular modo "real" y controlar la respuesta de la IA.
vi.mock('../lib/openai', () => ({
  isMockMode: false,
  createStructuredCompletion: vi.fn(),
}));

import { createStructuredCompletion } from '../lib/openai';
import { analyzeMessage } from '../services/corrector.service';

const mockedCreateStructuredCompletion = vi.mocked(createStructuredCompletion);

describe('corrector.service', () => {
  beforeEach(() => {
    mockedCreateStructuredCompletion.mockReset();
  });

  it('devuelve errores bien tipados cuando la IA responde algo válido', async () => {
    mockedCreateStructuredCompletion.mockResolvedValue({
      errors: [
        {
          original: 'I have 25 years',
          corrected: 'I am 25 years old',
          category: 'vocabulary',
          explanation: 'La edad se expresa con "to be" en inglés.',
        },
      ],
      correctedMessage: 'I am 25 years old.',
      quality: 'good',
    });

    const result = await analyzeMessage({
      lastUserMessage: 'I have 25 years.',
      previousMessages: [],
      userLevel: 'B1',
    });

    expect(result.quality).toBe('good');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].category).toBe('vocabulary');
    expect(result.correctedMessage).toBe('I am 25 years old.');
  });

  it('cae al fallback sin errores si la respuesta de la IA no valida contra el schema', async () => {
    mockedCreateStructuredCompletion.mockResolvedValue({
      errors: [{ original: 'x', corrected: 'y', category: 'not_a_real_category', explanation: 'z' }],
      correctedMessage: 'y',
      quality: 'good',
    });

    const result = await analyzeMessage({
      lastUserMessage: 'This is a test message.',
      previousMessages: [],
      userLevel: 'B1',
    });

    expect(result.errors).toEqual([]);
    expect(result.correctedMessage).toBe('This is a test message.');
  });

  it('cae al fallback sin cortar la conversación si la llamada a la IA falla', async () => {
    mockedCreateStructuredCompletion.mockRejectedValue(new Error('OpenAI timeout'));

    const result = await analyzeMessage({
      lastUserMessage: 'Another test message.',
      previousMessages: [],
      userLevel: 'A2',
    });

    expect(result.errors).toEqual([]);
    expect(result.correctedMessage).toBe('Another test message.');
  });
});
