import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth, signToken } from '../middleware/auth';
import { loginSchema } from '../schemas/auth.schema';
import type { Level } from '../schemas/enums';

export const authRouter = Router();

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  level: string;
  xp: number;
  streakDays: number;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    level: user.level as Level,
    xp: user.xp,
    streakDays: user.streakDays,
  };
}

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw AppError.unauthorized('Email o contraseña incorrectos', 'INVALID_CREDENTIALS');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw AppError.unauthorized('Email o contraseña incorrectos', 'INVALID_CREDENTIALS');
    }

    const token = signToken({ id: user.id, email: user.email, level: user.level as Level });
    res.json({ token, user: toPublicUser(user) });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }
    res.json({ user: toPublicUser(user) });
  })
);
