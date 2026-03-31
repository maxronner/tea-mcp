import { beforeEach, describe, expect, it } from "bun:test";
import {
  getExecCalls,
  queueExecSuccess,
  queueRepoDetection,
  repoDetectionCall,
  resetExecMocks,
  RESOLVED_REPO_SLUG,
} from "../setup";
import { getRegisteredTool, getRegisteredToolNames } from "../../src/server";

describe("issue tools", () => {
  beforeEach(() => {
    resetExecMocks();
  });

  it("registers the documented issue tool names", () => {
    expect(getRegisteredToolNames()).toEqual(
      expect.arrayContaining([
        "tea_issues_list",
        "tea_issue_view",
        "tea_issue_close",
        "tea_issue_reopen",
      ])
    );
  });

  it("lists issues with the documented defaults", async () => {
    queueRepoDetection();
    queueExecSuccess(JSON.stringify([{ number: 1, title: "Issue 1" }]));

    const result = await getRegisteredTool("tea_issues_list").handler({
      state: "open",
      limit: 30,
    });

    expect(result.content[0]?.text).toContain('"title": "Issue 1"');
    expect(getExecCalls()).toEqual([
      repoDetectionCall(),
      {
        file: "tea",
        args: [
          "issues",
          "list",
          "--output",
          "json",
          "--state",
          "open",
          "--limit",
          "30",
          "--repo",
          RESOLVED_REPO_SLUG,
        ],
      },
    ]);
  });

  it("views issue details with comments", async () => {
    queueRepoDetection();
    queueExecSuccess(JSON.stringify({ number: 42, comments: [] }));

    await getRegisteredTool("tea_issue_view").handler({ number: 42 });

    expect(getExecCalls()).toEqual([
      repoDetectionCall(),
      {
        file: "tea",
        args: ["issues", "42", "--output", "json", "--comments", "--repo", RESOLVED_REPO_SLUG],
      },
    ]);
  });

  it("closes and reopens issues", async () => {
    queueRepoDetection();
    queueExecSuccess("");
    queueRepoDetection();
    queueExecSuccess("");

    const closeResult = await getRegisteredTool("tea_issue_close").handler({ number: 7 });
    const reopenResult = await getRegisteredTool("tea_issue_reopen").handler({ number: 7 });

    expect(closeResult.content[0]?.text).toBe("Operation completed successfully");
    expect(reopenResult.content[0]?.text).toBe("Operation completed successfully");
    expect(getExecCalls()).toEqual([
      repoDetectionCall(),
      { file: "tea", args: ["issues", "close", "7", "--repo", RESOLVED_REPO_SLUG] },
      repoDetectionCall(),
      { file: "tea", args: ["issues", "reopen", "7", "--repo", RESOLVED_REPO_SLUG] },
    ]);
  });
});
