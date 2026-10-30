import { timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export function requireWriteKey(req: Request, _res: Response, next: NextFunction): void {
  if (!env.apiWriteKey) {
    if (env.nodeEnv === 'production') {
      next(
        new AppError(
          'WRITE_AUTH_NOT_CONFIGURED',
          'Write API authentication is not configured',
          503,
        ),
      );
      return;
    }

    next();
    return;
  }

  const authorization = req.header('authorization') ?? '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1] ?? '';
  const expected = Buffer.from(env.apiWriteKey);
  const provided = Buffer.from(token);

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    next(new AppError('INVALID_WRITE_CREDENTIALS', 'Valid bearer credentials are required', 401));
    return;
  }

  next();
}
