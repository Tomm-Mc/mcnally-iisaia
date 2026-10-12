import { Router, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { dailyMessageRateLimit } from '../middleware/rateLimit';
import { createSessionSchema, sendMessageSchema } from '../schemas/session.schema';
import { analyzeMessage } from '../services/corrector.service';
import { generateTutorReply } from '../services/tutor.service';
import { generateSessionSummary } from '../services/summary.service';
import { xpForMessage, xpForSessionComplete, updateStreak } from '../services/gamification.service';
import type { ErrorCategory, Level } from '../schemas/enums';

export const sessionsRouter = Router();

const sessionInclude = {
  scenario: true,
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: { corrections: true },
  },
};

/** Suma XP y actualiza la racha del usuario; devuelve el nuevo total de XP. */
async function bumpUserActivity(userId: string, xpDelta: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const newStreak = updateStreak(user.lastActiveDate, user.streakDays);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: xpDelta },
      streakDays: newStreak,
      lastActiveDate: new Date(),
    },
  });
  return updated;
}

sessionsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { scenarioId } = createSessionSchema.parse(req.body);
    const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
    if (!scenario) {
      throw AppError.notFound('Escenario no encontrado');
    }

    const session = await prisma.session.create({
      data: {
        userId: req.user!.id,
        scenarioId: scenario.id,
        messages: { create: [{ role: 'assistant', content: scenario.openingLine }] },
      },
      include: sessionInclude,
    });

    res.status(201).json({ session });
  })
);

sessionsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user!.id },
      include: { scenario: true },
      orderBy: { startedAt: 'desc' },
    });
    res.json({ sessions });
  })
);

sessionsRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: sessionInclude,
    });
    if (!session || session.userId !== req.user!.id) {
      throw AppError.notFound('Sesión no encontrada');
    }
    res.json({ session });
  })
);

function writeSseEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

sessionsRouter.post(
  '/:id/messages',
  requireAuth,
  dailyMessageRateLimit,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const userLevel = req.user!.level;
    const { content } = sendMessageSchema.parse(req.body);

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { scenario: true, messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session || session.userId !== userId) {
      throw AppError.notFound('Sesión no encontrada');
    }
    if (session.status !== 'active') {
      throw AppError.badRequest('Esta sesión ya terminó', 'SESSION_FINISHED');
    }

    // A partir de acá la respuesta es Server-Sent Events.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const userMessage = await prisma.message.create({
        data: { sessionId: session.id, role: 'user', content },
      });

      const previousMessages = session.messages.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const correction = await analyzeMessage({ lastUserMessage: content, previousMessages, userLevel });
      writeSseEvent(res, 'correction', correction);

      if (correction.errors.length > 0) {
        await prisma.correction.createMany({
          data: correction.errors.map((e) => ({
            messageId: userMessage.id,
            original: e.original,
            corrected: e.corrected,
            category: e.category,
            explanation: e.explanation,
          })),
        });
      }

      const xpFromMessage = xpForMessage(correction.quality);
      if (xpFromMessage > 0) {
        await bumpUserActivity(userId, xpFromMessage);
      }

      const history = [...session.messages, userMessage].slice(-20).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      let fullReply = '';
      for await (const chunk of generateTutorReply({
        scenario: session.scenario,
        userLevel,
        history,
      })) {
        fullReply += chunk;
        writeSseEvent(res, 'token', { token: chunk });
      }

      const assistantMessage = await prisma.message.create({
        data: { sessionId: session.id, role: 'assistant', content: fullReply.trim() },
      });

      const savedUserMessage = await prisma.message.findUnique({
        where: { id: userMessage.id },
        include: { corrections: true },
      });

      writeSseEvent(res, 'done', {
        userMessage: savedUserMessage,
        assistantMessage,
        xpEarned: xpFromMessage,
      });
      res.end();
    } catch (err) {
      console.error('❌ Error en el streaming de mensajes:', err);
      if (!res.writableEnded) {
        writeSseEvent(res, 'error', { message: 'Ocurrió un error procesando tu mensaje. Intentá de nuevo.' });
        res.end();
      }
    }
  })
);

sessionsRouter.post(
  '/:id/finish',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { scenario: true, messages: { include: { corrections: true }, orderBy: { createdAt: 'asc' } } },
    });
    if (!session || session.userId !== userId) {
      throw AppError.notFound('Sesión no encontrada');
    }

    if (session.status === 'finished') {
      res.json({ session, summary: session.summary ? JSON.parse(session.summary) : null });
      return;
    }

    const userMessages = session.messages.filter((m) => m.role === 'user').map((m) => m.content);
    const corrections = session.messages.flatMap((m) =>
      m.corrections.map((c) => ({
        original: c.original,
        corrected: c.corrected,
        category: c.category as ErrorCategory,
      }))
    );

    const summary = await generateSessionSummary(session.scenario.title, userMessages, corrections);
    const xpEarned = xpForSessionComplete();

    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: {
        status: 'finished',
        score: summary.score,
        summary: JSON.stringify(summary),
        xpEarned,
        finishedAt: new Date(),
      },
      include: sessionInclude,
    });

    await bumpUserActivity(userId, xpEarned);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    res.json({
      session: updatedSession,
      summary,
      xpEarned,
      user: { xp: user.xp, streakDays: user.streakDays, level: user.level as Level },
    });
  })
);
