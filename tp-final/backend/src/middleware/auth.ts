import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/express';

export interface JwtPayload {
  id: string;
  email: string;
  level: AuthUser['level'];
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw AppError.unauthorized('Falta el token de autenticación');
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { id: payload.id, email: payload.email, level: payload.level };
    next();
  } catch {
    throw AppError.unauthorized('Token inválido o expirado');
  }
}
