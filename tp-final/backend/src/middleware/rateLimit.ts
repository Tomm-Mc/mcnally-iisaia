import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../lib/asyncHandler';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Límite de mensajes de chat por usuario por día. */
export const dailyMessageRateLimit = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const date = todayStr();

  const usage = await prisma.dailyUsage.upsert({
    where: { userId_date: { userId, date } },
    update: {},
    create: { userId, date, messageCount: 0 },
  });

  if (usage.messageCount >= env.DAILY_MESSAGE_LIMIT) {
    throw AppError.tooManyRequests(
      `Llegaste al límite de ${env.DAILY_MESSAGE_LIMIT} mensajes por día. ¡Volvé mañana para seguir practicando!`
    );
  }

  await prisma.dailyUsage.update({
    where: { userId_date: { userId, date } },
    data: { messageCount: { increment: 1 } },
  });

  next();
});
