import type { ErrorCategory, Level } from '../schemas/enums';
import { CATEGORY_LABELS_ES } from '../schemas/enums';

export function buildExerciseGenerationPrompt(
  categories: ErrorCategory[],
  exampleErrors: { original: string; corrected: string; category: ErrorCategory }[],
  userLevel: Level
): string {
  const categoryLabels = categories.map((c) => `${c} (${CATEGORY_LABELS_ES[c]})`).join(', ');
  const examples =
    exampleErrors.length > 0
      ? exampleErrors
          .map((e) => `- Categoría ${e.category}: escribió "${e.original}", debía ser "${e.corrected}"`)
          .join('\n')
      : '(el usuario todavía no tiene errores registrados; generá ejercicios generales de esas categorías)';

  return `Sos un generador de ejercicios de inglés para hispanohablantes de nivel ${userLevel} (CEFR).

Generá exactamente 5 ejercicios enfocados en estas categorías de error, priorizando las primeras: ${categoryLabels}.

Ejemplos reales de errores que cometió este usuario:
${examples}

Para cada ejercicio elegí un tipo:
- fill_blank: una oración con un espacio en blanco marcado como "___" que el usuario debe completar.
- fix_sentence: una oración con un error a propósito que el usuario debe corregir.
- translate: una consigna en español que el usuario debe traducir al inglés.

Cada ejercicio necesita:
- "category": una de las categorías dadas.
- "type": fill_blank | fix_sentence | translate.
- "prompt": la consigna en español, corta y clara (qué tiene que hacer el usuario).
- "sentence": la oración en inglés (con el "___" si es fill_blank, o la oración con el error si es fix_sentence; para translate, poné la frase en español a traducir).
- "expectedAnswer": la respuesta correcta esperada en inglés.

Respondé ÚNICAMENTE con el JSON pedido.`;
}

export function buildExerciseEvaluationPrompt(
  exerciseSentence: string,
  expectedAnswer: string,
  userAnswer: string
): string {
  return `Un estudiante de inglés resolvió este ejercicio:
Oración/consigna: "${exerciseSentence}"
Respuesta esperada: "${expectedAnswer}"
Respuesta del estudiante: "${userAnswer}"

La respuesta del estudiante ya no coincidió textualmente con la esperada. Evaluá si es una respuesta EQUIVALENTE y válida (permitiendo sinónimos, mayúsculas/minúsculas, puntuación, variantes regionales) o si es incorrecta.

Respondé ÚNICAMENTE con el JSON pedido: "isCorrect" (boolean) y "feedback" (una frase breve en español explicando por qué).`;
}
