import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

// Validates + replaces req.body with the parsed (and coerced) result, so every
// route downstream can trust req.body's shape instead of re-checking it.
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }
    req.body = result.data;
    next();
  };
}
