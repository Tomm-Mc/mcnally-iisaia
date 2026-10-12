import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes';
import { scenariosRouter } from './routes/scenarios.routes';
import { sessionsRouter } from './routes/sessions.routes';
import { progressRouter } from './routes/progress.routes';
import { exercisesRouter } from './routes/exercises.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/scenarios', scenariosRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/exercises', exercisesRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });

  app.use(errorHandler);

  return app;
}
