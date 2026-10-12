export type Level = 'A2' | 'B1' | 'B2';

export type ErrorCategory =
  | 'verb_tense'
  | 'prepositions'
  | 'articles'
  | 'word_order'
  | 'vocabulary'
  | 'spelling'
  | 'plurals'
  | 'pronouns'
  | 'other';

export type Quality = 'excellent' | 'good' | 'needs_work';

export const CATEGORY_LABELS_ES: Record<ErrorCategory, string> = {
  verb_tense: 'Tiempos verbales',
  prepositions: 'Preposiciones',
  articles: 'Artículos',
  word_order: 'Orden de palabras',
  vocabulary: 'Vocabulario',
  spelling: 'Ortografía',
  plurals: 'Plurales',
  pronouns: 'Pronombres',
  other: 'Otros',
};

export interface User {
  id: string;
  email: string;
  name: string;
  level: Level;
  xp: number;
  streakDays: number;
}

export interface Scenario {
  id: string;
  slug: string;
  title: string;
  description: string;
  emoji: string;
  level: Level;
  characterName: string;
  characterRole: string;
  openingLine: string;
}

export interface CorrectionError {
  original: string;
  corrected: string;
  category: ErrorCategory;
  explanation: string;
}

export interface Correction {
  id: string;
  messageId: string;
  original: string;
  corrected: string;
  category: ErrorCategory;
  explanation: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  corrections?: Correction[];
}

export type SessionStatus = 'active' | 'finished';

export interface SessionSummary {
  score: number;
  strengths: string[];
  improvements: string[];
  tip: string;
}

export interface Session {
  id: string;
  userId: string;
  scenarioId: string;
  status: SessionStatus;
  score: number | null;
  summary: string | null;
  xpEarned: number;
  startedAt: string;
  finishedAt: string | null;
  scenario?: Scenario;
  messages?: Message[];
}

export interface Exercise {
  id: string;
  category: ErrorCategory;
  type: 'fill_blank' | 'fix_sentence' | 'translate';
  prompt: string;
  sentence: string;
  expectedAnswer?: string;
  userAnswer?: string | null;
  isCorrect?: boolean | null;
  feedback?: string | null;
}

export interface ProgressSummary {
  errorsByCategory: { category: ErrorCategory; label: string; count: number }[];
  topWeaknesses: ErrorCategory[];
  totals: { totalSessions: number; totalMessages: number; totalErrors: number };
  recentErrors: Correction[];
}

export interface TimelineEntry {
  date: string;
  errorCount: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}
