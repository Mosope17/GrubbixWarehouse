import type { AdminUser } from './api';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
    }
  }
}

export {};
