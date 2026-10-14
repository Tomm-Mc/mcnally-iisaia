import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes';
import { scenariosRouter } from './routes/scenarios.routes';
import { sessionsRouter } from './routes/sessions.routes';
import { speechRouter } from './routes/speech.routes';
import { progressRouter } from './routes/progress.routes';
import { exercisesRouter } from './routes/exercises.routes';
import { adminRouter } from './routes/admin.routes';
import { requireAuth, requireRole } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Las rutas de práctica son sólo para estudiantes: el admin no tiene sesiones,
  // XP ni ejercicios. Los routers repiten requireAuth por ruta; acá se agrega
  // el chequeo de rol (requireAuth va antes porque requireRole lee req.user).
  const studentOnly = [requireAuth, requireRole('student')];

  app.use('/api/auth', authRouter);
  app.use('/api/scenarios', ...studentOnly, scenariosRouter);
  app.use('/api/sessions', ...studentOnly, speechRouter);
  app.use('/api/sessions', ...studentOnly, sessionsRouter);
  app.use('/api/progress', ...studentOnly, progressRouter);
  app.use('/api/exercises', ...studentOnly, exercisesRouter);
  app.use('/api/admin', requireAuth, requireRole('admin'), adminRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });

  app.use(errorHandler);

  return app;
}
