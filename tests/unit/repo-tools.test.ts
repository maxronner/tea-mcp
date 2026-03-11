import { beforeEach, describe, expect, it } from "bun:test";
import { getExecCalls, queueExecSuccess, resetExecMocks } from "../setup";
import { getRegisteredTool, getRegisteredToolNames } from "../../src/server";

describe("repository tools", () => {
  beforeEach(() => {
    resetExecMocks();
  });

  it("registers the documented repository tool names", () => {
    expect(getRegisteredToolNames()).toEqual(
      expect.arrayContaining(["tea_repos_list", "tea_repo_view"])
    );
  });

  it("lists repositories", async () => {
    queueExecSuccess(JSON.stringify([{ full_name: "user/repo1" }]));

    await getRegisteredTool("tea_repos_list").handler({ limit: 30 });

    expect(getExecCalls()).toEqual([
      { file: "tea", args: ["repos", "list", "--output", "json", "--limit", "30"] },
    ]);
  });

  it("views the current or specified repository", async () => {
    queueExecSuccess(JSON.stringify({ full_name: "current/repo" }));
    queueExecSuccess(JSON.stringify({ full_name: "other/repo" }));

    await getRegisteredTool("tea_repo_view").handler({});
    await getRegisteredTool("tea_repo_view").handler({ repo: "other/repo" });

    expect(getExecCalls()).toEqual([
      { file: "tea", args: ["repos", "--output", "json"] },
      { file: "tea", args: ["repos", "other/repo", "--output", "json"] },
    ]);
  });
});
