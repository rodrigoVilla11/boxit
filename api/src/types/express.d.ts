import 'express';

// Extiende Express.Request con el usuario autenticado (lo setea JwtAuthGuard).
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; isAdmin: boolean };
    }
  }
}
