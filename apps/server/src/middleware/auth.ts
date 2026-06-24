import type { RequestHandler } from "express";
import { ApiError } from "../lib/ApiError.js";
import { verifyAccessToken } from "../lib/jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) throw ApiError.unauthorized();

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    throw ApiError.unauthorized("Session expired");
  }
};
