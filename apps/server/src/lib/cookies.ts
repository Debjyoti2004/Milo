import type { Response } from "express";
import { env } from "./env.js";

const COMMON = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, {
    ...COMMON,
    maxAge: env.jwtAccessTtlMin * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...COMMON,
    maxAge: env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken", COMMON);
  res.clearCookie("refreshToken", { ...COMMON, path: "/api/auth" });
}
