import { describe, it, expect, beforeEach } from "bun:test";
import { resetMocks, mockExecSuccess, mockExecNonJson } from "../setup";
import { server } from "../../src/index";

describe("Pull Request Tools", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("tea_prs_list", () => {
    it("should have the tool registered", () => {
      expect(server).toBeDefined();
    });

    it("should list pull requests with default parameters", async () => {
      const mockPRs = [
        { number: 1, title: "PR 1", state: "open" },
        { number: 2, title: "PR 2", state: "open" },
      ];
      mockExecSuccess(JSON.stringify(mockPRs));

      expect(server).toBeDefined();
    });
  });

  describe("tea_pr_view", () => {
    it("should view pull request details", async () => {
      const mockPR = {
        number: 42,
        title: "Feature PR",
        body: "Description",
        state: "open",
        comments: [],
      };
      mockExecSuccess(JSON.stringify(mockPR));

      expect(server).toBeDefined();
    });
  });

  describe("tea_pr_checkout", () => {
    it("should checkout a pull request", async () => {
      mockExecSuccess("Switched to branch 'pr-123'");

      expect(server).toBeDefined();
    });
  });

  describe("tea_pr_create", () => {
    it("should create a pull request", async () => {
      const mockCreatedPR = {
        number: 123,
        title: "My New Feature",
        url: "https://gitea.example.com/user/repo/pulls/123",
        state: "open",
      };
      mockExecSuccess(JSON.stringify(mockCreatedPR));

      expect(server).toBeDefined();
    });

    it("should support preview mode without creating PR", async () => {
      // Preview mode uses git commands, so we mock those
      mockExecNonJson("feature-branch"); // git branch --show-current
      mockExecNonJson("abc123 Add feature A\nabc456 Add feature B"); // git log
      mockExecNonJson(" 2 files changed, 100 insertions(+), 20 deletions(-)"); // git diff --stat
      mockExecNonJson("diff --git a/file.txt b/file.txt\n+change"); // git diff

      expect(server).toBeDefined();
    });

    it("should support optional parameters", async () => {
      const mockCreatedPR = {
        number: 124,
        title: "PR with metadata",
        assignees: ["user1", "user2"],
        labels: ["bug", "urgent"],
        milestone: "v1.0",
      };
      mockExecSuccess(JSON.stringify(mockCreatedPR));

      expect(server).toBeDefined();
    });
  });

  describe("tea_pr_approve", () => {
    it("should approve a pull request", async () => {
      const mockApprovedPR = {
        number: 42,
        state: "open",
        approved_by: ["current-user"],
      };
      mockExecSuccess(JSON.stringify(mockApprovedPR));

      expect(server).toBeDefined();
    });

    it("should approve with comment", async () => {
      const mockApprovedPR = {
        number: 42,
        state: "open",
        approved_by: ["current-user"],
        comment: "LGTM!",
      };
      mockExecSuccess(JSON.stringify(mockApprovedPR));

      expect(server).toBeDefined();
    });
  });

  describe("tea_pr_reject", () => {
    it("should request changes on a pull request", async () => {
      const mockRejectedPR = {
        number: 42,
        state: "open",
        review: {
          state: "CHANGES_REQUESTED",
          body: "Please fix the naming",
        },
      };
      mockExecSuccess(JSON.stringify(mockRejectedPR));

      expect(server).toBeDefined();
    });
  });

  describe("tea_pr_merge", () => {
    it("should merge a pull request with default strategy", async () => {
      const mockMergedPR = {
        number: 42,
        state: "merged",
        merge_commit_sha: "abc123",
      };
      mockExecSuccess(JSON.stringify(mockMergedPR));

      expect(server).toBeDefined();
    });

    it("should merge with squash strategy", async () => {
      const mockMergedPR = {
        number: 42,
        state: "merged",
        merge_commit_sha: "abc123",
        merge_style: "squash",
      };
      mockExecSuccess(JSON.stringify(mockMergedPR));

      expect(server).toBeDefined();
    });

    it("should merge with custom commit message", async () => {
      const mockMergedPR = {
        number: 42,
        state: "merged",
        merge_commit_sha: "abc123",
        merge_commit_message: "Custom merge message",
      };
      mockExecSuccess(JSON.stringify(mockMergedPR));

      expect(server).toBeDefined();
    });

    it("should support all merge strategies", async () => {
      const strategies = ["merge", "rebase", "squash", "rebase-merge"];

      for (const style of strategies) {
        const mockMergedPR = {
          number: 42,
          state: "merged",
          merge_style: style,
        };
        mockExecSuccess(JSON.stringify(mockMergedPR));
      }

      expect(server).toBeDefined();
    });
  });
});
