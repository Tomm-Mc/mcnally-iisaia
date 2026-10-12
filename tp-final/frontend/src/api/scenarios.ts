import { apiFetch } from './client';
import type { Level, Scenario } from './types';

export function fetchScenarios(level?: Level): Promise<{ scenarios: Scenario[] }> {
  const query = level ? `?level=${level}` : '';
  return apiFetch<{ scenarios: Scenario[] }>(`/scenarios${query}`);
}
