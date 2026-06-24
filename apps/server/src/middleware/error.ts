import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/ApiError.js";

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
    return;
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      fields[issue.path.join(".") || "_"] = issue.message;
    }
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid request", fields } });
    return;
  }

  const errStr = String(err?.message ?? err);
  if (errStr.includes("free_tier") && errStr.includes("limit: 0")) {
    res.status(402).json({
      error: {
        code: "AI_QUOTA",
        message: "Gemini free tier quota is 0 on this project. Enable billing at console.cloud.google.com, or create a free key at aistudio.google.com (AIza... format).",
      },
    });
    return;
  }
  if (errStr.includes("GEMINI_API_KEY")) {
    res.status(503).json({ error: { code: "AI_NOT_CONFIGURED", message: errStr } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
};
