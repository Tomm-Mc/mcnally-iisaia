export type Level = 'A2' | 'B1' | 'B2';

export type Role = 'student' | 'admin';

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

/** 'voice' = el mensaje es una transcripción del modo voz. */
export type InputMode = 'text' | 'voice';

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
  role: Role;
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

// --- Panel de administración ---

export type LoginOutcome = 'success' | 'invalid_credentials' | 'blocked';

export interface AdminOverview {
  ai: {
    mode: 'mock' | 'real';
    chatModel: string;
    sttModel: string;
    ttsModel: string;
    dailyMessageLimit: number;
  };
  students: {
    total: number;
    active7d: number;
    active30d: number;
    byLevel: { level: Level; count: number }[];
  };
  usage: {
    sessionsStarted: number;
    sessionsFinished: number;
    completionRate: number | null;
    averageScore: number | null;
    messages: number;
    voiceMessages: number;
    voiceShare: number | null;
    corrections: number;
    errorsPerMessage: number | null;
    exercisesGenerated: number;
    exercisesAnswered: number;
    exerciseAccuracy: number | null;
    limitHits30d: number;
  };
  logins7d: { success: number; invalidCredentials: number; blocked: number };
  scenarios: {
    id: string;
    slug: string;
    title: string;
    emoji: string;
    level: Level;
    sessions: number;
    finished: number;
    averageScore: number | null;
  }[];
  errorsByCategory: { category: ErrorCategory; label: string; count: number }[];
}

export interface DailyActivity {
  date: string;
  activeStudents: number;
  messages: number;
  voiceMessages: number;
  sessionsStarted: number;
  logins: number;
  failedLogins: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  level: Level;
  role: Role;
  xp: number;
  streakDays: number;
  lastActiveDate: string | null;
  createdAt: string;
  sessions: number;
  finishedSessions: number;
  averageScore: number | null;
  messages: number;
  corrections: number;
  exercisesAnswered: number;
  exerciseAccuracy: number | null;
  messagesToday: number;
  lastLoginAt: string | null;
}

export interface LoginEvent {
  id: string;
  email: string;
  outcome: LoginOutcome;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { name: string; role: Role } | null;
}

export interface AdminUserDetail {
  user: { id: string; name: string; email: string; level: Level; role: Role };
  activity: DailyActivity[];
  errorsByCategory: { category: ErrorCategory; label: string; count: number }[];
}
