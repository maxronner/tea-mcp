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

describe("comment tools", () => {
  beforeEach(() => {
    resetExecMocks();
  });

  it("registers tea_create_comment", () => {
    expect(getRegisteredToolNames()).toContain("tea_create_comment");
  });

  it("comments on an issue or pull request", async () => {
    queueRepoDetection();
    queueExecSuccess(JSON.stringify({ id: 1, body: "Test comment" }));

    const result = await getRegisteredTool("tea_create_comment").handler({
      index: 42,
      body: "This is a test comment",
    });

    expect(result.content[0]?.text).toContain("Test comment");
    expect(getExecCalls()).toEqual([
      repoDetectionCall(),
      {
        file: "tea",
        args: ["comment", "42", "This is a test comment", "--repo", RESOLVED_REPO_SLUG],
      },
    ]);
  });
});
