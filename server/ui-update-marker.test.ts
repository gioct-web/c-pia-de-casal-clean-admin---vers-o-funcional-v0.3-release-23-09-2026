import { describe, expect, it } from "vitest";

describe("ui update marker", () => {
  it("is available to the server without exposing a credential", () => {
    expect(process.env.CASAL_CLEAN_UI_UPDATE_MARKER).toBe("local-ui-validation-currency");
  });
});
