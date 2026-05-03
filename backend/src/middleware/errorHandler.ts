import { Request, Response, NextFunction } from 'express';

export class NotFoundError extends Error {
  name = 'NotFoundError';
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends Error {
  name = 'ValidationError';
  constructor(message: string) {
    super(message);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.name === 'NotFoundError') {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
  console.error('[errorHandler]', err.name, err.message, err.stack);
}
