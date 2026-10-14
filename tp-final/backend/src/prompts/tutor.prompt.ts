import type { Level } from '../schemas/enums';

interface ScenarioForPrompt {
  title: string;
  characterName: string;
  characterRole: string;
  systemPrompt: string;
}

/**
 * Prompt de sistema para el personaje de IA. Combina el contexto específico
 * del escenario con reglas generales de comportamiento (nivel, longitud,
 * no corregir al usuario -- de eso se encarga corrector.service).
 */
export function buildTutorSystemPrompt(scenario: ScenarioForPrompt, userLevel: Level, spoken = false): string {
  const spokenRules = spoken
    ? `
- Esta conversación es HABLADA: tu respuesta se va a leer en voz alta con text-to-speech. Escribí como se habla: frases naturales y fluidas, contracciones ("I'm", "you'll"), sin emojis, listas, markdown, paréntesis ni abreviaturas. Escribí los números y precios como se dicen ("twelve fifty", no "$12.50").
- Lo que dice el estudiante viene de una transcripción automática: si algo no se entiende, pedí que lo repita como lo haría una persona ("Sorry, could you say that again?").`
    : '';
  return `Sos ${scenario.characterName}, ${scenario.characterRole}, en el siguiente escenario: "${scenario.title}".

Contexto del personaje: ${scenario.systemPrompt}

Reglas que tenés que seguir SIEMPRE:
- Mantenete en personaje en todo momento. Nunca digas que sos una IA.
- Hablá siempre en inglés, adaptando el vocabulario y la complejidad gramatical al nivel ${userLevel} del estudiante (CEFR).
- Tus respuestas deben tener entre 1 y 3 oraciones. Nunca más.
- Hacé una pregunta o dejá un gancho para que la conversación siga avanzando.
- NO corrijas errores de gramática ni de vocabulario del estudiante. Otra parte del sistema se encarga de eso. Vos solo respondé naturalmente dentro del rol, como lo haría un hablante nativo.
- No repitas literalmente lo que dijo el estudiante, respondé de forma natural.${spokenRules}`;
}
