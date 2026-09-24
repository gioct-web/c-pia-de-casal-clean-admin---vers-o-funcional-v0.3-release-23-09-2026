import { describe, expect, it } from "vitest";
import { formatBRLInput, parseBRL } from "./currency";

describe("currency helpers", () => {
  it("formats Brazilian currency with cents", () => {
    expect(formatBRLInput(150)).toBe("R$ 150,00");
    expect(formatBRLInput(150.5)).toBe("R$ 150,50");
  });

  it("parses masked input without losing cents", () => {
    expect(parseBRL("R$ 150,00")).toBe(150);
    expect(parseBRL("R$ 150,50")).toBe(150.5);
    expect(parseBRL("R$ 1.234,56")).toBe(1234.56);
  });
});
