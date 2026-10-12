import { apiFetch } from './client';
import type { ProgressSummary, TimelineEntry } from './types';

export function fetchProgressSummary(): Promise<ProgressSummary> {
  return apiFetch<ProgressSummary>('/progress/summary');
}

export function fetchProgressTimeline(): Promise<{ timeline: TimelineEntry[] }> {
  return apiFetch<{ timeline: TimelineEntry[] }>('/progress/timeline');
}
