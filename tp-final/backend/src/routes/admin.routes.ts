import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { AppError } from '../lib/errors';
import {
  getAdminActivity,
  getAdminOverview,
  getAdminUserDetail,
  getAdminUsers,
  getRecentLogins,
} from '../lib/adminStats';
import { activityQuerySchema, loginsQuerySchema } from '../schemas/admin.schema';

/**
 * Panel del dueño de la app: sólo lectura. requireAuth + requireRole('admin')
 * se aplican al montar el router en app.ts.
 */
export const adminRouter = Router();

adminRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    res.json(await getAdminOverview());
  })
);

adminRouter.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const { days } = activityQuerySchema.parse(req.query);
    res.json({ activity: await getAdminActivity(days) });
  })
);

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    res.json({ users: await getAdminUsers() });
  })
);

adminRouter.get(
  '/users/:id/activity',
  asyncHandler(async (req, res) => {
    const { days } = activityQuerySchema.parse(req.query);
    const detail = await getAdminUserDetail(req.params.id, days);
    if (!detail) {
      throw AppError.notFound('Usuario no encontrado');
    }
    res.json(detail);
  })
);

adminRouter.get(
  '/logins',
  asyncHandler(async (req, res) => {
    const { limit } = loginsQuerySchema.parse(req.query);
    res.json({ logins: await getRecentLogins(limit) });
  })
);
