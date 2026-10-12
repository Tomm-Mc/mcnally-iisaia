import { z } from 'zod';

export const LEVELS = ['A2', 'B1', 'B2'] as const;
export type Level = (typeof LEVELS)[number];
export const levelSchema = z.enum(LEVELS);

export const SESSION_STATUSES = ['active', 'finished'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export const sessionStatusSchema = z.enum(SESSION_STATUSES);

export const MESSAGE_ROLES = ['user', 'assistant'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];
export const messageRoleSchema = z.enum(MESSAGE_ROLES);

export const ERROR_CATEGORIES = [
  'verb_tense',
  'prepositions',
  'articles',
  'word_order',
  'vocabulary',
  'spelling',
  'plurals',
  'pronouns',
  'other',
] as const;
export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];
export const errorCategorySchema = z.enum(ERROR_CATEGORIES);

export const QUALITIES = ['excellent', 'good', 'needs_work'] as const;
export type Quality = (typeof QUALITIES)[number];
export const qualitySchema = z.enum(QUALITIES);

export const EXERCISE_TYPES = ['fill_blank', 'fix_sentence', 'translate'] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];
export const exerciseTypeSchema = z.enum(EXERCISE_TYPES);

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
