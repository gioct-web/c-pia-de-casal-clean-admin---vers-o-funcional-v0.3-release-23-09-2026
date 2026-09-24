import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { appSettings } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { appRouter } from "./routers";

function createLoginContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: () => undefined,
      clearCookie: () => undefined,
    } as TrpcContext["res"],
  };
}

describe("credencial administrativa configurada", () => {
  it("aceita a senha protegida da conta Henrique no endpoint de login", async () => {
    const password = process.env.CASAL_CLEAN_HENRIQUE_PASSWORD;
    expect(password).toBeTruthy();
    const caller = appRouter.createCaller(createLoginContext());
    const result = await caller.auth.login({ username: "henrique.carlos", password: password! });
    expect(result).toMatchObject({ username: "henrique.carlos", role: "admin" });
  });

  it("persiste e consulta uma configuração administrativa pelo contrato tRPC", async () => {
    const key = "__integration_settings_check__";
    const context = { ...createLoginContext(), user: { id: 1, openId: null, username: "henrique.carlos", passwordHash: null, name: "Henrique Carlos", email: null, loginMethod: "password", role: "admin" as const, active: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } };
    const caller = appRouter.createCaller(context);
    await caller.admin.saveSettings([{ settingKey: key, settingValue: "ok" }]);
    const settings = await caller.admin.settings();
    expect(settings).toContainEqual(expect.objectContaining({ settingKey: key, settingValue: "ok" }));
    const db = await getDb();
    await db?.delete(appSettings).where(eq(appSettings.settingKey, key));
  });
});
