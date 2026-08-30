import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db, UserRecord } from './db';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[AUTH_SECURITY_ERROR] JWT_SECRET environment variable is not defined in production. ' +
        'Please configure a secure JWT_SECRET in your server environment variables or Cloudflare/host secrets.'
      );
    }
    // Only permitted during local development/test environments
    return 'dev_only_insecure_local_jwt_secret';
  }
  return secret;
}

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateToken(user: UserRecord): string {
    const secret = getJwtSecret();
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        isVip: user.isVip,
      },
      secret,
      { expiresIn: '30d' }
    );
  },

  verifyToken(token: string): { userId: string } | null {
    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret) as { userId: string };
      return decoded;
    } catch {
      return null;
    }
  },

  sanitizeUser(user: UserRecord) {
    const { passwordHash, resetToken, resetTokenExpires, ...safe } = user;
    return safe;
  },
};

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  const user = db.findUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'Account not found.' });
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);
    if (payload) {
      const user = db.findUserById(payload.userId);
      if (user) {
        req.user = user;
      }
    }
  }
  next();
}
