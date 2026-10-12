import type { Level } from '../schemas/enums';

export interface AuthUser {
  id: string;
  email: string;
  level: Level;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
