import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: 99,
      openId: null,
      username: "tester",
      passwordHash: null,
      name: "Tester",
      email: null,
      loginMethod: "password",
      role,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("validações e permissões", () => {
  it("bloqueia usuário comum antes de abrir o catálogo administrativo", async () => {
    await expect(appRouter.createCaller(context("user")).admin.users()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejeita um orçamento com campos obrigatórios inválidos antes de persistir", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.estimates.save({
      customerName: "",
      customerPhone: "11 1234-5678",
      customerAddress: "Rua sem número",
      customerCity: "",
      customerState: "SP",
      scheduledAt: "amanhã",
      expectedTotal: 100,
      items: [],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
