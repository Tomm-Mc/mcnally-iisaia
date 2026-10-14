import { Router, type Request } from 'express';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth, signToken } from '../middleware/auth';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import type { Level, LoginOutcome, Role } from '../schemas/enums';
import { isLoginBlocked, loginRetryAfterSeconds, recordLoginFailure, recordLoginSuccess } from '../lib/loginAttempts';

export const authRouter = Router();

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  level: string;
  role: string;
  xp: number;
  streakDays: number;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    level: user.level as Level,
    role: user.role as Role,
    xp: user.xp,
    streakDays: user.streakDays,
  };
}

/**
 * Registra el intento de login para el panel de administración. Nunca corta
 * el login: si falla la escritura, se loguea y sigue.
 */
async function recordLoginEvent(req: Request, email: string, outcome: LoginOutcome, userId: string | null) {
  // nginx manda la IP real del cliente en X-Real-IP; sin proxy, req.ip.
  const realIp = req.headers['x-real-ip'];
  try {
    await prisma.loginEvent.create({
      data: {
        email: email.trim().toLowerCase(),
        userId,
        outcome,
        ip: (typeof realIp === 'string' ? realIp : req.ip) ?? null,
        userAgent: req.headers['user-agent']?.slice(0, 300) ?? null,
      },
    });
  } catch (err) {
    console.error('❌ No se pudo registrar el evento de login:', err);
  }
}

/**
 * Registro básico con email y contraseña. Siempre crea un estudiante (nunca un
 * admin) y no devuelve token: después de registrarse, el usuario inicia sesión
 * por el flujo normal de /login.
 */
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, level } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw AppError.conflict('Ya existe una cuenta con ese email. Iniciá sesión o usá otro.', 'EMAIL_TAKEN');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({
        data: { name, email, passwordHash, level, role: 'student' },
      });
      res.status(201).json({ user: toPublicUser(user) });
    } catch (err) {
      // Dos registros simultáneos con el mismo email: el segundo choca con el @unique.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw AppError.conflict('Ya existe una cuenta con ese email. Iniciá sesión o usá otro.', 'EMAIL_TAKEN');
      }
      throw err;
    }
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    if (isLoginBlocked(email)) {
      await recordLoginEvent(req, email, 'blocked', null);
      const minutes = Math.ceil(loginRetryAfterSeconds(email) / 60);
      throw AppError.tooManyRequests(
        `Demasiados intentos fallidos. Probá de nuevo en ${minutes} minuto${minutes === 1 ? '' : 's'}.`,
        'LOGIN_RATE_LIMIT'
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      recordLoginFailure(email);
      await recordLoginEvent(req, email, 'invalid_credentials', null);
      throw AppError.unauthorized('Email o contraseña incorrectos', 'INVALID_CREDENTIALS');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      recordLoginFailure(email);
      await recordLoginEvent(req, email, 'invalid_credentials', user.id);
      throw AppError.unauthorized('Email o contraseña incorrectos', 'INVALID_CREDENTIALS');
    }

    recordLoginSuccess(email);
    await recordLoginEvent(req, email, 'success', user.id);
    const token = signToken({ id: user.id, email: user.email, level: user.level as Level, role: user.role as Role });
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
