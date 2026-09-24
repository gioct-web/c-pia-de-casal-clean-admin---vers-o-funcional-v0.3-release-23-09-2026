import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import type { User } from "../drizzle/schema";
import { createSessionRecord, getSessionUserByTokenHash, removeSessionRecord, touchUserSignIn } from "./db";

export const APP_SESSION_COOKIE = "casal_clean_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const cookieOptions = (req: Request) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production" || req.protocol === "https" || req.headers["x-forwarded-proto"] === "https", sameSite: "lax" as const, path: "/" });
export function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
export function verifyPassword(password: string, passwordHash: string | null) { if (!passwordHash) return false; const [salt, expected] = passwordHash.split(":"); if (!salt || !expected) return false; const candidate = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex"); const target = Buffer.from(expected, "hex"); return candidate.length === target.length && timingSafeEqual(candidate, target); }
export async function createUserSession(req: Request, res: Response, userId: number) { const token = randomBytes(48).toString("base64url"); const expiresAt = new Date(Date.now() + SESSION_DURATION_MS); await createSessionRecord(tokenHash(token), userId, expiresAt); await touchUserSignIn(userId); res.cookie(APP_SESSION_COOKIE, token, { ...cookieOptions(req), maxAge: SESSION_DURATION_MS }); }
export async function clearUserSession(req: Request, res: Response) { const token = parseCookieHeader(req.headers.cookie ?? "")[APP_SESSION_COOKIE]; if (token) await removeSessionRecord(tokenHash(token)); res.clearCookie(APP_SESSION_COOKIE, cookieOptions(req)); }
export async function getAuthenticatedUser(req: Request): Promise<User | null> { const token = parseCookieHeader(req.headers.cookie ?? "")[APP_SESSION_COOKIE]; if (!token) return null; const session = await getSessionUserByTokenHash(tokenHash(token)); return session && session.expiresAt.getTime() >= Date.now() ? session.user : null; }
export function sanitizeUser(user: User) { return { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role }; }
