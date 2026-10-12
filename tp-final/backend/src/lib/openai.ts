import OpenAI from 'openai';
import { env, isMockMode } from '../config/env';

export { isMockMode };

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

export function logAiMode(): void {
  if (isMockMode) {
    console.log('🤖 IA en modo MOCK (AI_MOCK_MODE=true o falta OPENAI_API_KEY). No se harán llamadas a OpenAI.');
  } else {
    console.log(`🤖 IA en modo REAL, usando el modelo "${env.OPENAI_MODEL}".`);
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface JsonSchemaSpec {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
}

/**
 * Pide una respuesta con Structured Outputs (response_format: json_schema) y
 * temperatura 0. Sólo debe llamarse cuando isMockMode es false.
 */
export async function createStructuredCompletion(
  messages: ChatMessage[],
  jsonSchema: JsonSchemaSpec
): Promise<unknown> {
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0,
    messages,
    response_format: {
      type: 'json_schema',
      json_schema: jsonSchema,
    },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('OpenAI no devolvió contenido');
  }
  return JSON.parse(raw);
}

/**
 * Streaming de tokens para la respuesta del personaje. Sólo debe llamarse
 * cuando isMockMode es false.
 */
export async function* streamChatCompletion(messages: ChatMessage[]): AsyncGenerator<string> {
  const openai = getClient();
  const stream = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.8,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}
