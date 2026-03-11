import { beforeEach, describe, expect, it } from "bun:test";
import { getExecCalls, queueExecError, queueExecSuccess, resetExecMocks } from "../setup";
import { execGit, execTea, resolveDefaultBranch } from "../../src/server";

describe("process helpers", () => {
  beforeEach(() => {
    resetExecMocks();
  });

  it("parses JSON output on success", async () => {
    const mockData = [{ id: 1, title: "Test Issue" }];
    queueExecSuccess(JSON.stringify(mockData));

    const result = await execTea(["issues", "list"]);

    expect(result).toEqual(mockData);
    expect(getExecCalls()).toEqual([{ file: "tea", args: ["issues", "list"] }]);
  });

  it("handles stderr notes on success", async () => {
    queueExecSuccess(JSON.stringify({ success: true }), "note");

    const result = await execTea(["issues", "list"]);

    expect(result).toEqual({ success: true });
  });

  it("handles empty output", async () => {
    queueExecSuccess("");

    const result = await execTea(["issues", "close", "1"]);

    expect(result).toEqual({ success: true });
  });

  it("handles non-JSON output", async () => {
    queueExecSuccess("Successfully checked out PR #123");

    const result = await execTea(["pulls", "checkout", "123"]);

    expect(result).toEqual({
      success: true,
      message: "Successfully checked out PR #123",
      stderr: "",
    });
  });

  it("rejects on command failure", async () => {
    queueExecError(1, "Repository not found");

    await expect(execTea(["issues", "list"])).rejects.toThrow("Repository not found");
  });

  it("preserves argument boundaries for spaced values", async () => {
    queueExecSuccess("{}");

    await execTea([
      "pulls",
      "create",
      "--title",
      "Feature with spaces",
      "--description",
      "body with $shell && chars",
    ]);

    expect(getExecCalls()).toEqual([
      {
        file: "tea",
        args: [
          "pulls",
          "create",
          "--title",
          "Feature with spaces",
          "--description",
          "body with $shell && chars",
        ],
      },
    ]);
  });

  it("returns trimmed git output", async () => {
    queueExecSuccess("feature-branch\n");

    const result = await execGit(["branch", "--show-current"]);

    expect(result).toBe("feature-branch");
    expect(getExecCalls()).toEqual([{ file: "git", args: ["branch", "--show-current"] }]);
  });

  it("resolves the default branch from origin HEAD", async () => {
    queueExecSuccess("origin/master\n");

    const result = await resolveDefaultBranch();

    expect(result).toBe("master");
    expect(getExecCalls()).toEqual([
      { file: "git", args: ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"] },
    ]);
  });

  it("falls back to remote show when symbolic-ref fails", async () => {
    queueExecError(1, "no origin head");
    queueExecSuccess("  HEAD branch: trunk\n");

    const result = await resolveDefaultBranch();

    expect(result).toBe("trunk");
    expect(getExecCalls()).toEqual([
      { file: "git", args: ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"] },
      { file: "git", args: ["remote", "show", "origin"] },
    ]);
  });
});
