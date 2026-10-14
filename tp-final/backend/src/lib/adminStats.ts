import { prisma } from './prisma';
import { getErrorCountsByCategory } from './weakness';
import { env, isMockMode } from '../config/env';
import { CATEGORY_LABELS_ES, type ErrorCategory, type Level, type LoginOutcome, type Role } from '../schemas/enums';

/*
 * Estadísticas para el panel de administración. Se calculan en memoria a partir
 * de consultas simples: con SQLite y el volumen de un TP es más claro que SQL
 * crudo, y Prisma no permite agrupar por día. Los días son UTC, igual que la
 * racha y el rate limit (ver CLAUDE.md del proyecto).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Inicio (00:00 UTC) del día que está `days - 1` días antes de `now`. */
export function startOfWindow(days: number, now: Date = new Date()): Date {
  const start = new Date(`${toDayKey(now)}T00:00:00.000Z`);
  return new Date(start.getTime() - (days - 1) * MS_PER_DAY);
}

/** Claves YYYY-MM-DD de los últimos `days` días (UTC), del más viejo al de hoy. */
export function lastNDays(days: number, now: Date = new Date()): string[] {
  const start = startOfWindow(days, now).getTime();
  return Array.from({ length: days }, (_, i) => toDayKey(new Date(start + i * MS_PER_DAY)));
}

/** Porcentaje entero (0-100), o null si no hay base para calcularlo. */
export function percentage(part: number, total: number): number | null {
  return total === 0 ? null : Math.round((part / total) * 100);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
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

interface ActivityInput {
  messages: { createdAt: Date; inputMode: string; userId: string }[];
  sessions: { startedAt: Date }[];
  logins: { createdAt: Date; outcome: string }[];
}

/** Arma la serie diaria a partir de los eventos crudos. Pura, para poder testearla. */
export function buildDailyActivity(input: ActivityInput, days: number, now: Date = new Date()): DailyActivity[] {
  const series = new Map<string, DailyActivity & { users: Set<string> }>();
  for (const date of lastNDays(days, now)) {
    series.set(date, {
      date,
      activeStudents: 0,
      messages: 0,
      voiceMessages: 0,
      sessionsStarted: 0,
      logins: 0,
      failedLogins: 0,
      users: new Set(),
    });
  }

  for (const m of input.messages) {
    const day = series.get(toDayKey(m.createdAt));
    if (!day) continue;
    day.messages += 1;
    if (m.inputMode === 'voice') day.voiceMessages += 1;
    day.users.add(m.userId);
  }
  for (const s of input.sessions) {
    const day = series.get(toDayKey(s.startedAt));
    if (day) day.sessionsStarted += 1;
  }
  for (const l of input.logins) {
    const day = series.get(toDayKey(l.createdAt));
    if (!day) continue;
    if (l.outcome === 'success') day.logins += 1;
    else day.failedLogins += 1;
  }

  return [...series.values()].map(({ users, ...day }) => ({ ...day, activeStudents: users.size }));
}

/** Mensajes de estudiantes desde una fecha (opcionalmente de un solo usuario), con el usuario aplanado. */
async function studentMessagesSince(since: Date, userId?: string) {
  const rows = await prisma.message.findMany({
    where: { role: 'user', createdAt: { gte: since }, ...(userId ? { session: { userId } } : {}) },
    select: { createdAt: true, inputMode: true, session: { select: { userId: true } } },
  });
  return rows.map((m) => ({ createdAt: m.createdAt, inputMode: m.inputMode, userId: m.session.userId }));
}

export async function getAdminOverview(now: Date = new Date()) {
  const since7 = startOfWindow(7, now);
  const since30 = startOfWindow(30, now);

  const [
    students,
    levelGroups,
    recentMessages,
    sessionsStarted,
    finishedSessions,
    messages,
    voiceMessages,
    corrections,
    exercisesGenerated,
    exercisesAnswered,
    exercisesCorrect,
    loginGroups,
    limitHits30d,
    scenarios,
    categoryGroups,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.user.groupBy({ by: ['level'], where: { role: 'student' }, _count: { _all: true } }),
    studentMessagesSince(since30),
    prisma.session.count(),
    prisma.session.findMany({ where: { status: 'finished' }, select: { score: true } }),
    prisma.message.count({ where: { role: 'user' } }),
    prisma.message.count({ where: { role: 'user', inputMode: 'voice' } }),
    prisma.correction.count(),
    prisma.exercise.count(),
    prisma.exercise.count({ where: { isCorrect: { not: null } } }),
    prisma.exercise.count({ where: { isCorrect: true } }),
    prisma.loginEvent.groupBy({ by: ['outcome'], where: { createdAt: { gte: since7 } }, _count: { _all: true } }),
    prisma.dailyUsage.count({
      where: { date: { gte: toDayKey(since30) }, messageCount: { gte: env.DAILY_MESSAGE_LIMIT } },
    }),
    prisma.scenario.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        emoji: true,
        level: true,
        sessions: { select: { status: true, score: true } },
      },
    }),
    prisma.correction.groupBy({ by: ['category'], _count: { _all: true } }),
  ]);

  const active7 = new Set(recentMessages.filter((m) => m.createdAt >= since7).map((m) => m.userId));
  const active30 = new Set(recentMessages.map((m) => m.userId));
  const scores = finishedSessions.map((s) => s.score).filter((s): s is number => s !== null);
  const loginsByOutcome = Object.fromEntries(loginGroups.map((g) => [g.outcome, g._count._all])) as Partial<
    Record<LoginOutcome, number>
  >;

  return {
    ai: {
      mode: isMockMode ? ('mock' as const) : ('real' as const),
      chatModel: env.OPENAI_MODEL,
      sttModel: env.OPENAI_STT_MODEL,
      ttsModel: env.OPENAI_TTS_MODEL,
      dailyMessageLimit: env.DAILY_MESSAGE_LIMIT,
    },
    students: {
      total: students,
      active7d: active7.size,
      active30d: active30.size,
      byLevel: levelGroups
        .map((g) => ({ level: g.level as Level, count: g._count._all }))
        .sort((a, b) => a.level.localeCompare(b.level)),
    },
    usage: {
      sessionsStarted,
      sessionsFinished: finishedSessions.length,
      completionRate: percentage(finishedSessions.length, sessionsStarted),
      averageScore: average(scores),
      messages,
      voiceMessages,
      voiceShare: percentage(voiceMessages, messages),
      corrections,
      errorsPerMessage: messages === 0 ? null : Math.round((corrections / messages) * 100) / 100,
      exercisesGenerated,
      exercisesAnswered,
      exerciseAccuracy: percentage(exercisesCorrect, exercisesAnswered),
      limitHits30d,
    },
    logins7d: {
      success: loginsByOutcome.success ?? 0,
      invalidCredentials: loginsByOutcome.invalid_credentials ?? 0,
      blocked: loginsByOutcome.blocked ?? 0,
    },
    scenarios: scenarios
      .map((s) => {
        const finished = s.sessions.filter((x) => x.status === 'finished');
        return {
          id: s.id,
          slug: s.slug,
          title: s.title,
          emoji: s.emoji,
          level: s.level as Level,
          sessions: s.sessions.length,
          finished: finished.length,
          averageScore: average(finished.map((x) => x.score).filter((x): x is number => x !== null)),
        };
      })
      .sort((a, b) => b.sessions - a.sessions),
    errorsByCategory: categoryGroups
      .map((g) => ({
        category: g.category as ErrorCategory,
        label: CATEGORY_LABELS_ES[g.category as ErrorCategory] ?? g.category,
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getAdminActivity(days: number, now: Date = new Date()) {
  const since = startOfWindow(days, now);
  const [messages, sessions, logins] = await Promise.all([
    studentMessagesSince(since),
    prisma.session.findMany({ where: { startedAt: { gte: since } }, select: { startedAt: true } }),
    prisma.loginEvent.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, outcome: true } }),
  ]);
  return buildDailyActivity({ messages, sessions, logins }, days, now);
}

/**
 * Detalle de un usuario para el panel: su actividad diaria y sus errores por
 * categoría. Devuelve null si el usuario no existe.
 */
export async function getAdminUserDetail(userId: string, days: number, now: Date = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, level: true, role: true },
  });
  if (!user) return null;

  const since = startOfWindow(days, now);
  const [messages, sessions, logins, errorCounts] = await Promise.all([
    studentMessagesSince(since, userId),
    prisma.session.findMany({ where: { userId, startedAt: { gte: since } }, select: { startedAt: true } }),
    prisma.loginEvent.findMany({ where: { userId, createdAt: { gte: since } }, select: { createdAt: true, outcome: true } }),
    getErrorCountsByCategory(userId),
  ]);

  return {
    user: { ...user, level: user.level as Level, role: user.role as Role },
    activity: buildDailyActivity({ messages, sessions, logins }, days, now),
    errorsByCategory: errorCounts.map((c) => ({ category: c.category, label: CATEGORY_LABELS_ES[c.category], count: c.count })),
  };
}

export async function getAdminUsers(now: Date = new Date()) {
  const today = toDayKey(now);
  const [users, sessions, corrections, exerciseGroups, lastLogins, usageToday] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        role: true,
        xp: true,
        streakDays: true,
        lastActiveDate: true,
        createdAt: true,
      },
    }),
    prisma.session.findMany({
      select: { userId: true, status: true, score: true, _count: { select: { messages: { where: { role: 'user' } } } } },
    }),
    prisma.correction.findMany({ select: { message: { select: { session: { select: { userId: true } } } } } }),
    prisma.exercise.groupBy({ by: ['userId', 'isCorrect'], _count: { _all: true } }),
    prisma.loginEvent.groupBy({
      by: ['userId'],
      where: { outcome: 'success', userId: { not: null } },
      _max: { createdAt: true },
    }),
    prisma.dailyUsage.findMany({ where: { date: today }, select: { userId: true, messageCount: true } }),
  ]);

  const correctionsByUser = new Map<string, number>();
  for (const c of corrections) {
    const userId = c.message.session.userId;
    correctionsByUser.set(userId, (correctionsByUser.get(userId) ?? 0) + 1);
  }
  const lastLoginByUser = new Map(lastLogins.map((l) => [l.userId, l._max.createdAt]));
  const usageTodayByUser = new Map(usageToday.map((u) => [u.userId, u.messageCount]));

  return users.map((user) => {
    const own = sessions.filter((s) => s.userId === user.id);
    const finished = own.filter((s) => s.status === 'finished');
    const exercises = exerciseGroups.filter((g) => g.userId === user.id);
    const answered = exercises.filter((g) => g.isCorrect !== null).reduce((sum, g) => sum + g._count._all, 0);
    const correct = exercises.filter((g) => g.isCorrect === true).reduce((sum, g) => sum + g._count._all, 0);

    return {
      ...user,
      level: user.level as Level,
      role: user.role as Role,
      sessions: own.length,
      finishedSessions: finished.length,
      averageScore: average(finished.map((s) => s.score).filter((s): s is number => s !== null)),
      messages: own.reduce((sum, s) => sum + s._count.messages, 0),
      corrections: correctionsByUser.get(user.id) ?? 0,
      exercisesAnswered: answered,
      exerciseAccuracy: percentage(correct, answered),
      messagesToday: usageTodayByUser.get(user.id) ?? 0,
      lastLoginAt: lastLoginByUser.get(user.id) ?? null,
    };
  });
}

export async function getRecentLogins(limit: number) {
  const events = await prisma.loginEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      email: true,
      outcome: true,
      ip: true,
      userAgent: true,
      createdAt: true,
      user: { select: { name: true, role: true } },
    },
  });
  return events.map((e) => ({
    ...e,
    outcome: e.outcome as LoginOutcome,
    user: e.user ? { name: e.user.name, role: e.user.role as Role } : null,
  }));
}
