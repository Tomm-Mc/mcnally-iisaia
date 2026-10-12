import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { getErrorCountsByCategory } from '../lib/weakness';
import { CATEGORY_LABELS_ES } from '../schemas/enums';

export const progressRouter = Router();

progressRouter.get(
  '/summary',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const [errorCounts, totalSessions, totalMessages, recentErrors] = await Promise.all([
      getErrorCountsByCategory(userId),
      prisma.session.count({ where: { userId, status: 'finished' } }),
      prisma.message.count({ where: { session: { userId }, role: 'user' } }),
      prisma.correction.findMany({
        where: { message: { session: { userId } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          original: true,
          corrected: true,
          category: true,
          explanation: true,
          createdAt: true,
        },
      }),
    ]);

    const totalErrors = errorCounts.reduce((sum, c) => sum + c.count, 0);

    res.json({
      errorsByCategory: errorCounts.map((c) => ({
        category: c.category,
        label: CATEGORY_LABELS_ES[c.category],
        count: c.count,
      })),
      topWeaknesses: errorCounts.slice(0, 3).map((c) => c.category),
      totals: { totalSessions, totalMessages, totalErrors },
      recentErrors,
    });
  })
);

progressRouter.get(
  '/timeline',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const corrections = await prisma.correction.findMany({
      where: { message: { session: { userId } }, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const countsByDay = new Map<string, number>();
    for (const c of corrections) {
      const day = c.createdAt.toISOString().slice(0, 10);
      countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
    }

    const timeline: { date: string; errorCount: number }[] = [];
    for (let i = 0; i < 30; i += 1) {
      const day = new Date(since);
      day.setDate(day.getDate() + i);
      const key = day.toISOString().slice(0, 10);
      timeline.push({ date: key, errorCount: countsByDay.get(key) ?? 0 });
    }

    res.json({ timeline });
  })
);
