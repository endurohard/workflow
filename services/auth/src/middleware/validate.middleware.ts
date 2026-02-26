import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

/**
 * Middleware factory to validate request body against a Joi schema
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    // Replace request body with validated and sanitized value
    req.body = value;
    next();
  };
}
