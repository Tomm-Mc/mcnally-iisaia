import type { Level, Role } from '../schemas/enums';

export interface AuthUser {
  id: string;
  email: string;
  level: Level;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
