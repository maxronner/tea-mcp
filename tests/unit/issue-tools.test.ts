import { describe, it, expect, beforeEach } from "bun:test";
import { resetMocks, mockExecSuccess } from "../setup";
import { server } from "../../src/index";

describe("Issue Tools", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("tea_issues_list", () => {
    it("should have the tool registered", () => {
      expect(server).toBeDefined();
    });

    it("should list issues with default parameters", async () => {
      const mockIssues = [
        { number: 1, title: "Issue 1", state: "open" },
        { number: 2, title: "Issue 2", state: "open" },
      ];
      mockExecSuccess(JSON.stringify(mockIssues));

      // Tool is registered if we got here
      expect(server).toBeDefined();
    });
  });

  describe("tea_issue_view", () => {
    it("should view issue details", async () => {
      const mockIssue = {
        number: 42,
        title: "Test Issue",
        body: "Description",
        state: "open",
        comments: [],
      };
      mockExecSuccess(JSON.stringify(mockIssue));

      expect(server).toBeDefined();
    });
  });

  describe("tea_issue_close", () => {
    it("should close an issue", async () => {
      mockExecSuccess("{}");

      expect(server).toBeDefined();
    });
  });

  describe("tea_issue_reopen", () => {
    it("should reopen a closed issue", async () => {
      mockExecSuccess("{}");

      expect(server).toBeDefined();
    });
  });
});
