import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(code: string, message: string, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError('ROUTE_NOT_FOUND', `Route ${req.originalUrl} not found`, 404));
};

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = error.issues[0]?.message || 'Invalid request payload';
  } else if ((error as { code?: string }).code === 'P2002') {
    statusCode = 409;
    code = 'DB_CONFLICT';
    message = 'A conflict occurred while saving data';
  } else if ((error as { code?: string }).code === 'P2025') {
    statusCode = 404;
    code = 'DB_NOT_FOUND';
    message = 'Record not found';
  } else if (error instanceof Error) {
    message = error.message;
  }

  const response: {
    success: boolean;
    error: {
      code: string;
      message: string;
      details?: string;
    };
  } = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
    response.error.details = error.stack || 'No stack trace available';
  }

  res.status(statusCode).json(response);
};
