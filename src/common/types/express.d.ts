// src/common/types/express.d.ts
declare namespace Express {
  interface User {
    id: string;
    email: string;
    role: string;
  }

  interface Request {
    tenantId?: string;
  }
}
