import { NextFunction, Request, Response } from "express";
import { z } from "zod";

const formatIssues = (issues: z.core.$ZodIssue[]) =>
  issues.map((issue) => ({
    field: issue.path.join(".") || "request",
    message: issue.message,
  }));

export const validateBody = (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Request validation failed",
        errors: formatIssues(result.error.issues),
      });
      return;
    }

    req.body = result.data;
    next();
  };

export const validateParams = (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({
        message: "Request validation failed",
        errors: formatIssues(result.error.issues),
      });
      return;
    }

    next();
  };
