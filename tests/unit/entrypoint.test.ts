import { describe, expect, it } from "bun:test";
import { isMainModule } from "../../src/server";

describe("entrypoint helpers", () => {
  it("does not treat non-entry imports as the main module", () => {
    const originalArgv = process.argv;
    process.argv = [originalArgv[0] ?? "bun", "/tmp/other-file.js"];

    try {
      expect(isMainModule(import.meta.url)).toBe(false);
    } finally {
      process.argv = originalArgv;
    }
  });
});
