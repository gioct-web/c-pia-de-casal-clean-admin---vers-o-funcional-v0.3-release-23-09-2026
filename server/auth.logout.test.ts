import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./auth";

describe("credenciais locais", () => {
  it("não permite autenticar uma senha diferente da senha armazenada", () => {
    const hash = hashPassword("Credencial@2026");
    expect(verifyPassword("Credencial@2026", hash)).toBe(true);
    expect(verifyPassword("Credencial@2025", hash)).toBe(false);
  });
});
