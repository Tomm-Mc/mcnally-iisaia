import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { levelSchema } from '../schemas/enums';

export const scenariosRouter = Router();

scenariosRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const levelParam = req.query.level;
    const levelFilter = typeof levelParam === 'string' ? levelSchema.safeParse(levelParam) : undefined;

    const scenarios = await prisma.scenario.findMany({
      where: levelFilter?.success ? { level: levelFilter.data } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    res.json({ scenarios });
  })
);
