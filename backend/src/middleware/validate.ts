import { Request, Response, NextFunction } from 'express';
import Ajv from 'ajv';
import { ValidationError } from './errorHandler';

const ajv = new Ajv({ allErrors: true });

export function validateBody(schema: object) {
  const validate = ajv.compile(schema);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const valid = validate(req.body);
    if (!valid && validate.errors) {
      const messages = validate.errors
        .map((e) => `${e.instancePath || 'body'} ${e.message}`)
        .join(', ');
      return next(new ValidationError(`Validation failed: ${messages}`));
    }
    next();
  };
}
