import { z } from 'zod';

export const messageAnalysisSchema = z.object({
  text: z.string({ required_error: 'Text field is required' })
    .min(1, 'Text cannot be empty')
    .max(50000, 'Text exceeds maximum length of 50,000 characters'),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  clientMaskCounts: z.record(z.string(), z.number()).optional(),
}).strict();

export const codeAnalysisSchema = z.object({
  code: z.string({ required_error: 'Code field is required' })
    .min(1, 'Code cannot be empty')
    .max(50000, 'Code exceeds maximum length of 50,000 characters'),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  clientMaskCounts: z.record(z.string(), z.number()).optional(),
}).strict();

/**
 * Express middleware generator for Zod schema validation
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'The submitted request payload does not conform to the required schema.',
          issues: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Malformed request body' });
    }
  };
}
