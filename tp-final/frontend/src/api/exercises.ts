import { apiFetch } from './client';
import type { Exercise } from './types';

export function generateExercises(): Promise<{ exercises: Exercise[] }> {
  return apiFetch<{ exercises: Exercise[] }>('/exercises/generate', { method: 'POST' });
}

export interface AnswerExerciseResponse {
  exercise: Exercise;
  xpEarned: number;
}

export function answerExercise(exerciseId: string, answer: string): Promise<AnswerExerciseResponse> {
  return apiFetch<AnswerExerciseResponse>(`/exercises/${exerciseId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer }),
  });
}
