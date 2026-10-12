import type { Quality } from '../schemas/enums';

export const XP_RULES = {
  MESSAGE_EXCELLENT: 10,
  MESSAGE_GOOD: 5,
  EXERCISE_CORRECT: 15,
  SESSION_COMPLETE: 20,
} as const;

/** XP ganado por un mensaje del usuario, según la calidad detectada por el corrector. */
export function xpForMessage(quality: Quality): number {
  if (quality === 'excellent') return XP_RULES.MESSAGE_EXCELLENT;
  if (quality === 'good') return XP_RULES.MESSAGE_GOOD;
  return 0;
}

/** XP ganado por resolver un ejercicio correctamente. */
export function xpForExercise(isCorrect: boolean): number {
  return isCorrect ? XP_RULES.EXERCISE_CORRECT : 0;
}

/** XP ganado por completar una sesión de conversación. */
export function xpForSessionComplete(): number {
  return XP_RULES.SESSION_COMPLETE;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const dateA = new Date(`${a}T00:00:00.000Z`).getTime();
  const dateB = new Date(`${b}T00:00:00.000Z`).getTime();
  return Math.round((dateB - dateA) / msPerDay);
}

/**
 * Calcula la nueva racha de días consecutivos.
 * - Si la última actividad fue "ayer" respecto de `now`, la racha suma 1.
 * - Si la última actividad fue "hoy", la racha se mantiene igual.
 * - Si fue antes de ayer (o no hay actividad previa), la racha vuelve a 1.
 */
export function updateStreak(lastActiveDate: Date | null, currentStreak: number, now: Date = new Date()): number {
  const today = toDateOnly(now);

  if (!lastActiveDate) {
    return 1;
  }

  const lastActive = toDateOnly(lastActiveDate);
  const diff = daysBetween(lastActive, today);

  if (diff === 0) {
    return currentStreak;
  }
  if (diff === 1) {
    return currentStreak + 1;
  }
  return 1;
}
