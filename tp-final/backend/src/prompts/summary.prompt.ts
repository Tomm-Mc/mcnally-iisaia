import type { ErrorCategory } from '../schemas/enums';

interface CorrectionForSummary {
  original: string;
  corrected: string;
  category: ErrorCategory;
}

export function buildSummaryPrompt(
  scenarioTitle: string,
  userMessages: string[],
  corrections: CorrectionForSummary[]
): string {
  const messagesBlock = userMessages.map((m, i) => `${i + 1}. ${m}`).join('\n');
  const correctionsBlock =
    corrections.length > 0
      ? corrections.map((c) => `- (${c.category}) "${c.original}" -> "${c.corrected}"`).join('\n')
      : '(no se detectaron errores en esta sesión)';

  return `Sos un tutor de inglés que acaba de terminar una sesión de práctica conversacional con un estudiante hispanohablante, en el escenario "${scenarioTitle}".

Mensajes que escribió el estudiante durante la sesión:
${messagesBlock}

Errores detectados durante la sesión:
${correctionsBlock}

Generá un resumen de cierre con:
- "score": puntaje de 0 a 100 según la cantidad y gravedad de errores en relación a la cantidad de mensajes.
- "strengths": exactamente 2 puntos fuertes concretos (en español).
- "improvements": 2 o 3 puntos a mejorar concretos (en español), basados en los errores reales.
- "tip": un consejo práctico y breve en español para la próxima sesión.

Respondé ÚNICAMENTE con el JSON pedido.`;
}
