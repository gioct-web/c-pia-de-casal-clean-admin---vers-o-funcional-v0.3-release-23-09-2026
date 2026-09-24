import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const context: TrpcContext = {
  user: { id: 1, openId: null, username: "henrique.carlos", passwordHash: null, name: "Henrique Carlos", email: null, loginMethod: "password", role: "admin", active: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

describe("catálogo importado da planilha", () => {
  it("disponibiliza os cinco produtos e preserva preços específicos publicados", async () => {
    const catalog = await appRouter.createCaller(context).catalog.list();
    expect(catalog).toHaveLength(14);
    expect(new Set(catalog.map(rule => rule.productKey))).toEqual(new Set(["sofa", "poltrona", "cadeira", "banqueta", "colchao"]));
    expect(catalog).toContainEqual(expect.objectContaining({ productKey: "sofa", places: "2 lugares", itemType: "retrátil", fabric: "suede", washPrice: 200, waterproofPrice: 200 }));
    expect(catalog).toContainEqual(expect.objectContaining({ productKey: "sofa", places: "3 lugares", itemType: "fixo", fabric: "linho", washPrice: 350, waterproofPrice: 350 }));
    expect(catalog).toContainEqual(expect.objectContaining({ productKey: "poltrona", places: "1 lugar", itemType: "padrão", fabric: "veludo", washPrice: 120, waterproofPrice: 120 }));
    expect(catalog).not.toContainEqual(expect.objectContaining({ productKey: "sofa", places: "5 lugares", itemType: "fixo", fabric: "suede" }));
  });
});
