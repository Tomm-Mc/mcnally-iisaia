---
name: charla-ai-layer
description: Reglas para la capa de IA de Charla — prompts, Structured Outputs, validación Zod, modo mock y fallbacks. Aplica a prompts/, y a los schemas y services de IA.
scope: backend/ia
parent: ../../CLAUDE.md
applies_to:
  - "tp-final/backend/src/prompts/**"
  - "tp-final/backend/src/schemas/{corrector,exercise,summary,speech}.schema.ts"
  - "tp-final/backend/src/services/{tutor,corrector,exercise,summary,speech}.service.ts"
  - "tp-final/backend/src/lib/openai.ts"
provider: OpenAI (SDK `openai` v4: Chat Completions, audio.transcriptions, audio.speech)
models:
  chat: gpt-4o-mini (OPENAI_MODEL)
  stt: gpt-4o-mini-transcribe (OPENAI_STT_MODEL)
  tts: gpt-4o-mini-tts (OPENAI_TTS_MODEL)
last_reviewed: 2026-10-14
---

# Capa de IA — prompts, schemas y servicios

Charla tiene cinco "agentes", cada uno con prompt, schema y servicio propios:

| Agente | Prompt | Schema de salida | Servicio | Modo | Temp. |
|---|---|---|---|---|---|
| Tutor (personaje) | `tutor.prompt.ts` | — (texto libre, streaming) | `tutor.service.ts` | `streamChatCompletion` | 0.8 |
| Corrector | `corrector.prompt.ts` | `corrector.schema.ts` | `corrector.service.ts` | `createStructuredCompletion` | 0 |
| Ejercicios (generar + evaluar) | `exercise.prompt.ts` | `exercise.schema.ts` | `exercise.service.ts` | `createStructuredCompletion` | 0 |
| Resumen de sesión | `summary.prompt.ts` | `summary.schema.ts` | `summary.service.ts` | `createStructuredCompletion` | 0 |
| Voz (STT + TTS) | `speech.prompt.ts` | — (texto / audio MP3) | `speech.service.ts` | `transcribeAudio` / `synthesizeSpeech` | — |

El agente de voz no genera contenido: el STT transcribe **literal** (el prompt prohíbe corregir; si no, el corrector no tiene qué marcar) y el TTS lee la respuesta del tutor con la voz del personaje (`VOICE_BY_SCENARIO`, por slug) y un ritmo según el nivel. Sus fallbacks no son el mock: si falla el STT devuelve `null` (la ruta responde `502 TRANSCRIPTION_FAILED` y el usuario repite); si falla el TTS devuelve `null` (el frontend usa la voz del navegador). Con `inputMode: 'voice'` el corrector ignora ortografía y puntuación, y el tutor suma reglas de "texto para ser hablado".

## Principios (no negociables)

1. **Separación de roles**: el tutor **nunca** corrige ni sale del personaje; el corrector **sólo** analiza el último mensaje del usuario. No fusiones estas responsabilidades en un mismo prompt.
2. **Toda salida estructurada pasa por Structured Outputs + Zod**: `createStructuredCompletion(messages, jsonSchema)` y después `zodSchema.safeParse(raw)`. Nunca uses el JSON de la IA sin validar.
3. **Los servicios de IA nunca lanzan por culpa de la IA**: ante excepción o respuesta inválida, `console.error('❌ ...')` y devolver un fallback con la misma forma (para el corrector, "sin errores"; para el resto, la salida del mock). Una falla de OpenAI no puede cortar la conversación. Excepción documentada: los servicios de voz devuelven `null` y la **ruta** decide (STT → `502` para que el usuario repita, porque no se puede inventar lo que dijo; TTS → `204` y voz del navegador).
4. **Siempre hay rama mock**: el primer `if` de cada servicio es `if (isMockMode) return mockX(...)`. El mock tiene que ser realista (forma y contenido plausibles) porque se usa en demos. En voz: el STT mock rota `MOCK_TRANSCRIPTS` (frases con errores típicos, para que el corrector mock tenga qué marcar) y el TTS mock devuelve `null`.
5. **El SDK sólo se toca desde `lib/openai.ts`**. Si necesitás otro tipo de llamada (otro modelo, otra temperatura, tools), agregá un helper ahí.

## Cómo escribir un prompt

- Los prompts son **funciones puras** `buildXxxPrompt(...): string` en `prompts/`, sin I/O ni imports de Prisma. Datos dinámicos entran por parámetro.
- Los prompts de instrucciones están en **español rioplatense** (voseo: "Sos", "Analizá", "Respondé"). El personaje del tutor habla **siempre en inglés** al usuario.
- Excepción: los prompts de **audio** (`speech.prompt.ts`) van en **inglés**. El de STT funciona como "texto previo" que condiciona la transcripción, y las `instructions` del TTS describen cómo suena un hablante nativo.
- Variantes por modo (`inputMode: 'voice'` en el corrector, `spoken` en el tutor) se agregan como **reglas extra condicionales** al final de la lista, sin duplicar el prompt.
- Toda explicación pedagógica que ve el usuario (explicaciones del corrector, feedback, fortalezas, tips) se pide **en español rioplatense**, breve y concreta (el corrector: máximo 25 palabras; Zod corta en 200 caracteres).
- Adaptá al nivel CEFR del usuario (`A2 | B1 | B2`): pasalo siempre como parámetro.
- Estructura recomendada, como los existentes: rol en una oración → contexto → lista de "Reglas:" con guiones → cierre "Respondé ÚNICAMENTE con el JSON pedido, sin texto adicional." en los prompts estructurados.
- Listá explícitamente qué **no** hacer cuando hay riesgo de sobrecorrección (estilo, contracciones, "gonna", variantes UK/US).
- Las categorías válidas que nombra el prompt tienen que coincidir con `ERROR_CATEGORIES`.
- El texto del usuario se interpola entre comillas en el mensaje `user`, nunca en el `system`.

## Cómo agregar/modificar un schema de salida

Cada salida estructurada tiene **dos** definiciones en el mismo archivo `schemas/<x>.schema.ts`:

1. **Zod** (`xxxSchema` + `type Xxx = z.infer<...>`): fuente de verdad de las restricciones (longitudes, rangos, cantidad de ítems). Si la IA no las cumple, cae al fallback.
2. **JSON Schema para OpenAI** (`xxxJsonSchema = { name, strict: true, schema } as const`), con:
   - `additionalProperties: false` en **todos** los objetos;
   - **todas** las propiedades listadas en `required` (requisito del modo `strict`; para opcionales usá unión con `null`);
   - enums copiados literalmente de `enums.ts`.

Mantené ambas definiciones en sincronía en el mismo cambio y agregá un caso en `tests/schemas.test.ts`.

## Receta: nueva funcionalidad de IA

1. `prompts/<x>.prompt.ts` con el builder.
2. `schemas/<x>.schema.ts` con Zod + JSON Schema.
3. `services/<x>.service.ts`:
   ```ts
   export async function hacerAlgo(params: Params): Promise<Resultado> {
     if (isMockMode) return mockAlgo(params);
     try {
       const raw = await createStructuredCompletion(messages, algoJsonSchema);
       const parsed = algoSchema.safeParse(raw);
       if (!parsed.success) {
         console.error('❌ Respuesta de <algo> no válida:', parsed.error.flatten());
         return mockAlgo(params);
       }
       return parsed.data;
     } catch (err) {
       console.error('❌ Error llamando a <algo>:', err);
       return mockAlgo(params);
     }
   }
   ```
4. Test en `tests/<x>.service.test.ts` mockeando `../lib/openai` (`isMockMode: false`, `createStructuredCompletion: vi.fn()`) con los tres casos: válido, inválido → fallback, excepción → fallback.
5. Si suma una categoría, nivel o tipo nuevo: actualizá `enums.ts`, los JSON Schemas y `frontend/src/api/types.ts`.

## Costos y límites

- Contexto enviado: corrector = últimos 6 mensajes; tutor = system + opening line + últimos 20; STT = sólo la última línea del personaje. No mandes la conversación entera.
- TTS: una llamada por fragmento de respuesta (el frontend junta oraciones muy cortas para no fragmentar de más). Texto máximo 1000 caracteres (`speech.schema.ts`).
- `/transcriptions` y `/speech` no pasan por `DAILY_MESSAGE_LIMIT`.
- Respuestas del tutor: 1 a 3 oraciones (lo exige el prompt). No subas ese límite sin motivo.
- `DAILY_MESSAGE_LIMIT` protege el gasto por usuario; no lo saltees en rutas nuevas que llamen a la IA en loop.
- Desarrollá y probá en modo mock. No hagas llamadas reales a OpenAI salvo pedido explícito del usuario.

## Gotchas

- `Scenario.systemPrompt` (en la base, cargado por el seed) es sólo el **contexto del personaje**; las reglas generales las agrega `buildTutorSystemPrompt`. No dupliques reglas en el seed.
- El `openingLine` se inyecta como primer mensaje `assistant` en `tutor.service.ts`, además de estar guardado como mensaje en la sesión. Tenelo en cuenta si cambiás cómo se arma el historial.
- **El STT tiene que ser literal**: si "arregla" la gramática, el corrector no encuentra nada y se pierde el feedback, que es el objetivo del producto. No saques esa instrucción de `buildTranscriptionPrompt`.
- Con `inputMode: 'voice'` el corrector (real y mock) **no** marca ortografía ni puntuación: esos errores los pone la transcripción, no el estudiante.
- Voces del TTS por `Scenario.slug` en `VOICE_BY_SCENARIO`; un escenario nuevo sin entrada usa `alloy`. Si agregás un escenario en el seed, asignale voz.
- `instructions` del TTS sólo se mandan si `OPENAI_TTS_MODEL` empieza con `gpt-` (`tts-1`/`tts-1-hd` las rechazan).
- `evaluateAnswer` compara primero con normalización (minúsculas, sin puntuación) y sólo si no coincide llama a la IA.
- El mock del corrector aplica las reglas regex sobre el **mensaje original** pero acumula las correcciones sobre `correctedMessage`; si agregás una regla, sumá también un ejercicio en `MOCK_TEMPLATES` de esa categoría si no existe.
