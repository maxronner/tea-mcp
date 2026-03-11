import { beforeEach, describe, expect, it } from "bun:test";
import { getExecCalls, queueExecSuccess, resetExecMocks } from "../setup";
import { getRegisteredTool, getRegisteredToolNames } from "../../src/server";

describe("pull request tools", () => {
  beforeEach(() => {
    resetExecMocks();
  });

  it("registers the documented pull request tool names", () => {
    expect(getRegisteredToolNames()).toEqual(
      expect.arrayContaining([
        "tea_prs_list",
        "tea_pr_view",
        "tea_pr_checkout",
        "tea_pr_create",
        "tea_pr_approve",
        "tea_pr_reject",
        "tea_pr_merge",
      ])
    );
  });

  it("creates a pull request without collapsing spaced arguments", async () => {
    queueExecSuccess("feature branch\n");
    queueExecSuccess("origin/master\n");
    queueExecSuccess(JSON.stringify({ number: 123, title: "My PR" }));

    const result = await getRegisteredTool("tea_pr_create").handler({
      title: "My PR title",
      description: "A body with spaces && symbols",
      preview: false,
    });

    expect(result.content[0]?.text).toContain('"number": 123');
    expect(getExecCalls()).toEqual([
      { file: "git", args: ["branch", "--show-current"] },
      { file: "git", args: ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"] },
      {
        file: "tea",
        args: [
          "pulls",
          "create",
          "--output",
          "json",
          "--title",
          "My PR title",
          "--description",
          "A body with spaces && symbols",
          "--base",
          "master",
        ],
      },
    ]);
  });

  it("uses the resolved default branch in preview mode", async () => {
    queueExecSuccess("feature-branch\n");
    queueExecSuccess("origin/trunk\n");
    queueExecSuccess("abc123 Add feature\n");
    queueExecSuccess("1 file changed\n");
    queueExecSuccess("diff --git a/file.txt b/file.txt\n+change\n");

    const result = await getRegisteredTool("tea_pr_create").handler({
      title: "Preview PR",
      preview: true,
    });

    expect(result.content[0]?.text).toContain("**Source:** feature-branch -> **Target:** trunk");
    expect(getExecCalls()).toEqual([
      { file: "git", args: ["branch", "--show-current"] },
      { file: "git", args: ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"] },
      { file: "git", args: ["log", "trunk..feature-branch", "--oneline"] },
      { file: "git", args: ["diff", "trunk...feature-branch", "--stat"] },
      { file: "git", args: ["diff", "trunk...feature-branch"] },
    ]);
  });

  it("passes approval and rejection messages as single arguments", async () => {
    queueExecSuccess(JSON.stringify({ ok: true }));
    queueExecSuccess(JSON.stringify({ ok: true }));

    await getRegisteredTool("tea_pr_approve").handler({
      index: 42,
      comment: "LGTM with one note",
    });
    await getRegisteredTool("tea_pr_reject").handler({
      index: 42,
      reason: "Please fix title casing && docs",
    });

    expect(getExecCalls()).toEqual([
      {
        file: "tea",
        args: ["pulls", "approve", "42", "--output", "json", "LGTM with one note"],
      },
      {
        file: "tea",
        args: ["pulls", "reject", "42", "Please fix title casing && docs", "--output", "json"],
      },
    ]);
  });

  it("merges with the requested strategy and message", async () => {
    queueExecSuccess(JSON.stringify({ state: "merged" }));

    await getRegisteredTool("tea_pr_merge").handler({
      index: 42,
      style: "squash",
      title: "Merge title",
      message: "Merge body",
    });

    expect(getExecCalls()).toEqual([
      {
        file: "tea",
        args: [
          "pulls",
          "merge",
          "42",
          "--output",
          "json",
          "--style",
          "squash",
          "--title",
          "Merge title",
          "--message",
          "Merge body",
        ],
      },
    ]);
  });
});
