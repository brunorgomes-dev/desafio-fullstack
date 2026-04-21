import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { logWarn } from '../utils/logger';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logWarn('auth.missing_header', { method: req.method, path: req.originalUrl });
    return res.status(401).json({ error: 'Token nao fornecido.' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    logWarn('auth.invalid_header_format', { method: req.method, path: req.originalUrl });
    return res.status(401).json({ error: 'Token nao fornecido.' });
  }

  try {
    const secret = process.env.JWT_SECRET ?? 'fallback_secret';
    const decoded = jwt.verify(token, secret) as { userId: number };

    (req as any).user = { id: decoded.userId };
    return next();
  } catch (_error) {
    logWarn('auth.invalid_or_expired_token', { method: req.method, path: req.originalUrl });
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }
};
