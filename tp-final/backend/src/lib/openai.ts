import OpenAI, { toFile } from 'openai';
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
  if (isMockMode && !env.AI_MOCK_MODE) {
    console.warn('⚠️ AI_MOCK_MODE=false pero OPENAI_API_KEY está vacía: la IA queda en modo MOCK igual.');
  } else if (isMockMode) {
    console.log('🤖 IA en modo MOCK (AI_MOCK_MODE=true o falta OPENAI_API_KEY). No se harán llamadas a OpenAI.');
  } else {
    console.log(
      `🤖 IA en modo REAL, usando "${env.OPENAI_MODEL}" (chat), "${env.OPENAI_STT_MODEL}" (STT) y "${env.OPENAI_TTS_MODEL}" (TTS).`
    );
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

/**
 * Speech-to-text: transcribe un audio grabado en el navegador. El SDK infiere
 * el formato por la extensión del nombre de archivo, por eso se pasa explícito.
 * Sólo debe llamarse cuando isMockMode es false.
 */
export async function transcribeAudio(audio: Buffer, filename: string, prompt: string): Promise<string> {
  const openai = getClient();
  const response = await openai.audio.transcriptions.create({
    model: env.OPENAI_STT_MODEL,
    file: await toFile(audio, filename),
    language: 'en',
    prompt,
  });
  return response.text;
}

export interface SpeechOptions {
  voice: string;
  instructions: string;
}

/**
 * Text-to-speech: devuelve el audio en MP3. `instructions` (tono, ritmo) sólo
 * lo aceptan los modelos gpt-4o-*-tts; tts-1 / tts-1-hd lo rechazan.
 * Sólo debe llamarse cuando isMockMode es false.
 */
export async function synthesizeSpeech(text: string, options: SpeechOptions): Promise<Buffer> {
  const openai = getClient();
  const supportsInstructions = env.OPENAI_TTS_MODEL.startsWith('gpt-');
  const response = await openai.audio.speech.create({
    model: env.OPENAI_TTS_MODEL,
    voice: options.voice,
    input: text,
    response_format: 'mp3',
    ...(supportsInstructions ? { instructions: options.instructions } : {}),
  });
  return Buffer.from(await response.arrayBuffer());
}
