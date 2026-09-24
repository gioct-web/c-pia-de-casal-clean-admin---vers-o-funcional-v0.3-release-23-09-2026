import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getAuthenticatedUser } from "../auth";

export type TrpcContext = { req: CreateExpressContextOptions["req"]; res: CreateExpressContextOptions["res"]; user: User | null };
export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> { try { return { req: opts.req, res: opts.res, user: await getAuthenticatedUser(opts.req) }; } catch { return { req: opts.req, res: opts.res, user: null }; } }
