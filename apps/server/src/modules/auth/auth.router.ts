import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginSchema, signupSchema } from "@gym/shared";
import { ApiError } from "../../lib/ApiError.js";
import { clearAuthCookies, setAuthCookies } from "../../lib/cookies.js";
import { toUserDTO } from "../../lib/serialize.js";
import { asyncHandler } from "../../middleware/error.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import * as authService from "./auth.service.js";

export const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post(
  "/signup",
  authRateLimit,
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.signup(req.body);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({ user: toUserDTO(user) });
  }),
);

authRouter.post(
  "/login",
  authRateLimit,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: toUserDTO(user) });
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const incoming = req.cookies?.refreshToken as string | undefined;
    if (!incoming) throw ApiError.unauthorized();
    const { accessToken, refreshToken } = await authService.refresh(incoming);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(204).end();
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    await authService.logout(req.cookies?.refreshToken as string | undefined);
    clearAuthCookies(res);
    res.status(204).end();
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.userId!);
    res.json({ user: toUserDTO(user), profile: user.profile });
  }),
);
