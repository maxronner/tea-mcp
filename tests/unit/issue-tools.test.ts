import { beforeEach, describe, expect, it } from "bun:test";
import { getExecCalls, queueExecSuccess, resetExecMocks } from "../setup";
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
    queueExecSuccess(JSON.stringify([{ number: 1, title: "Issue 1" }]));

    const result = await getRegisteredTool("tea_issues_list").handler({
      state: "open",
      limit: 30,
    });

    expect(result.content[0]?.text).toContain('"title": "Issue 1"');
    expect(getExecCalls()).toEqual([
      {
        file: "tea",
        args: ["issues", "list", "--output", "json", "--state", "open", "--limit", "30"],
      },
    ]);
  });

  it("views issue details with comments", async () => {
    queueExecSuccess(JSON.stringify({ number: 42, comments: [] }));

    await getRegisteredTool("tea_issue_view").handler({ index: 42 });

    expect(getExecCalls()).toEqual([
      {
        file: "tea",
        args: ["issues", "42", "--output", "json", "--comments"],
      },
    ]);
  });

  it("closes and reopens issues", async () => {
    queueExecSuccess("");
    queueExecSuccess("");

    const closeResult = await getRegisteredTool("tea_issue_close").handler({ index: 7 });
    const reopenResult = await getRegisteredTool("tea_issue_reopen").handler({ index: 7 });

    expect(closeResult.content[0]?.text).toBe("Operation completed successfully");
    expect(reopenResult.content[0]?.text).toBe("Operation completed successfully");
    expect(getExecCalls()).toEqual([
      { file: "tea", args: ["issues", "close", "7"] },
      { file: "tea", args: ["issues", "reopen", "7"] },
    ]);
  });
});
