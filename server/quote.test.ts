import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage, calculateLineTotal, calculateServiceBasePrice, calculateUnitPrice, formatEstimateNumber } from "../shared/quote";
import { shouldOpenWhatsAppInCurrentView } from "../shared/webview";
import { hashPassword, verifyPassword } from "./auth";

describe("regras de orçamento", () => {
  it("calcula preço por serviço, sujeira e quantidade", () => {
    expect(calculateUnitPrice(100, "leve")).toBe(100);
    expect(calculateUnitPrice(100, "medio")).toBe(120);
    expect(calculateLineTotal(100, "pesado", 3)).toBe(420);
    expect(calculateLineTotal(calculateServiceBasePrice(180, 120, "lavagem_impermeabilizacao"), "medio", 2)).toBe(720);
  });
  it("serializa um resumo completo para WhatsApp", () => {
    const message = buildWhatsAppMessage({ quoteNumber: "#000042", customerName: "Marina Souza", customerPhone: "(11) 99999-9999", customerAddress: "Rua das Flores, 100, Centro", customerCity: "São Paulo", customerState: "SP", scheduledAt: new Date("2026-08-21T13:30:00.000Z"), scheduleStatus: "to_define", total: 552, items: [{ productName: "Sofá", places: "3 lugares", itemType: "retrátil", fabric: "linho", dirtLevel: "medio", service: "lavagem_impermeabilizacao", quantity: 2, unitPrice: 276, lineTotal: 552 }] });
    expect(formatEstimateNumber(42)).toBe("#000042"); expect(formatEstimateNumber()).toBe("#000001"); expect(message).toContain("A definir com o cliente"); expect(message).toContain("Total geral");
  });
  it("reconhece WebView Android e preserva verificação de senha", () => {
    expect(shouldOpenWhatsAppInCurrentView("Mozilla/5.0 (Linux; Android 14; Pixel; wv)")).toBe(true); const hash = hashPassword("senha-segura"); expect(verifyPassword("senha-segura", hash)).toBe(true); expect(verifyPassword("outra", hash)).toBe(false);
  });
});
