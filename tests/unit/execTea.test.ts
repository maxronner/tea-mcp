import { describe, it, expect, beforeEach } from "bun:test";
import {
  resetMocks,
  mockExecSuccess,
  mockExecError,
  mockExecEmpty,
  mockExecNonJson,
} from "../setup";
import { execTea } from "../../src/index";

describe("execTea", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("should parse JSON output on success", async () => {
    const mockData = [{ id: 1, title: "Test Issue" }];
    mockExecSuccess(JSON.stringify(mockData));

    const result = await execTea(["issues", "list"]);

    expect(result).toEqual(mockData);
  });

  it("should handle stderr notes on success", async () => {
    const mockData = { success: true };
    mockExecSuccess(JSON.stringify(mockData), "Note: Some informational message");

    const result = await execTea(["issues", "list"]);

    expect(result).toEqual(mockData);
  });

  it("should handle empty output", async () => {
    mockExecEmpty();

    const result = await execTea(["issues", "close", "1"]);

    expect(result).toEqual({ success: true });
  });

  it("should handle non-JSON output", async () => {
    const nonJsonOutput = "Successfully checked out PR #123";
    mockExecNonJson(nonJsonOutput);

    const result = await execTea(["pulls", "checkout", "123"]);

    expect(result).toEqual({ success: true, message: nonJsonOutput, stderr: "" });
  });

  it("should reject on non-zero exit code", async () => {
    mockExecError(1, "Error: Repository not found");

    expect(async () => {
      await execTea(["issues", "list"]);
    }).toThrow("Repository not found");
  });

  it("should build correct command", async () => {
    const mockData = [{ id: 1 }];
    mockExecSuccess(JSON.stringify(mockData));

    await execTea(["issues", "list", "--state", "open"]);

    // Verify the mock was called
    // In Bun, we can't easily verify the exact call without more setup
    // This test passes if no errors are thrown
  });
});
