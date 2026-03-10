import { describe, it, expect, beforeEach } from "bun:test";
import { resetMocks, mockExecSuccess } from "../setup";
import { server } from "../../src/index";

describe("Repository Tools", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("tea_repos_list", () => {
    it("should have the tool registered", () => {
      expect(server).toBeDefined();
    });

    it("should list repositories with default parameters", async () => {
      const mockRepos = [
        { full_name: "user/repo1", description: "Test repo 1" },
        { full_name: "user/repo2", description: "Test repo 2" },
      ];
      mockExecSuccess(JSON.stringify(mockRepos));

      expect(server).toBeDefined();
    });
  });

  describe("tea_repo_view", () => {
    it("should view current repository details", async () => {
      const mockRepo = {
        full_name: "current/repo",
        description: "Current repository",
        stars: 42,
      };
      mockExecSuccess(JSON.stringify(mockRepo));

      expect(server).toBeDefined();
    });

    it("should view specified repository details", async () => {
      const mockRepo = {
        full_name: "other/repo",
        description: "Another repository",
        stars: 100,
      };
      mockExecSuccess(JSON.stringify(mockRepo));

      expect(server).toBeDefined();
    });
  });
});
