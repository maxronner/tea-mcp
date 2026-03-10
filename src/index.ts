#!/usr/bin/env node
import { exec } from "child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export const server = new McpServer({
  name: "tea",
  version: "1.0.0",
});

function formatResponse(data: any): string {
  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object") {
    if (Array.isArray(data) && data.length === 0) {
      return "No results found";
    }

    if (data.success === true && Object.keys(data).length === 1) {
      return "Operation completed successfully";
    }
  }

  return JSON.stringify(data, null, 2);
}

function formatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `Error: ${message}`;
}

// Execute tea command and parse JSON output
export async function execTea(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const cmd = `tea ${args.join(" ")}`;

    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      // Tea outputs notes to stderr even on success
      // Only fail if exit code != 0
      if (error && error.code !== 0) {
        reject(new Error(stderr || error.message));
        return;
      }

      // Parse JSON from stdout
      const output = stdout.trim();
      if (!output) {
        // Empty output - might be success for some commands
        resolve({ success: true });
        return;
      }

      try {
        const data = JSON.parse(output);
        resolve(data);
      } catch (e) {
        // Some commands return non-JSON (e.g., checkout)
        resolve({ success: true, message: output, stderr });
      }
    });
  });
}

// Execute git command
export async function execGit(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const cmd = `git ${args.join(" ")}`;

    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

// ============================================================
// ISSUE TOOLS
// ============================================================

// List issues
server.tool(
  "issues_list",
  "List issues in the current repository",
  {
    state: z.enum(["open", "closed", "all"]).optional().default("open"),
    limit: z.number().min(1).max(100).optional().default(30),
    labels: z.string().optional(),
    author: z.string().optional(),
  },
  async ({ state, limit, labels, author }) => {
    try {
      const args = [
        "issues",
        "list",
        "--output",
        "json",
        "--state",
        state,
        "--limit",
        String(limit),
      ];
      if (labels) args.push("--labels", labels);
      if (author) args.push("--author", author);

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// View issue details
server.tool(
  "issue_view",
  "View details of a specific issue",
  {
    index: z.number().positive().describe("Issue number"),
  },
  async ({ index }) => {
    try {
      const args = ["issues", String(index), "--output", "json", "--comments"];

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// Close issue
server.tool(
  "issue_close",
  "Close an issue",
  {
    index: z.number().positive().describe("Issue number to close"),
  },
  async ({ index }) => {
    try {
      const args = ["issues", "close", String(index)];

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// Reopen issue
server.tool(
  "issue_reopen",
  "Reopen a closed issue",
  {
    index: z.number().positive().describe("Issue number to reopen"),
  },
  async ({ index }) => {
    try {
      const args = ["issues", "reopen", String(index)];

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// ============================================================
// PULL REQUEST TOOLS
// ============================================================

// List PRs
server.tool(
  "prs_list",
  "List pull requests in the current repository",
  {
    state: z.enum(["open", "closed", "all"]).optional().default("open"),
    limit: z.number().min(1).max(100).optional().default(30),
  },
  async ({ state, limit }) => {
    try {
      const args = [
        "pulls",
        "list",
        "--output",
        "json",
        "--state",
        state,
        "--limit",
        String(limit),
      ];

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// View PR details
server.tool(
  "pr_view",
  "View details of a specific pull request",
  {
    index: z.number().positive().describe("Pull request number"),
  },
  async ({ index }) => {
    try {
      const args = ["pulls", String(index), "--output", "json", "--comments"];

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// Checkout PR
server.tool(
  "pr_checkout",
  "Checkout a pull request locally",
  {
    index: z.number().positive().describe("Pull request number to checkout"),
  },
  async ({ index }) => {
    try {
      const args = ["pulls", "checkout", String(index)];

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// Create PR
server.tool(
  "pr_create",
  "Create a new pull request with optional preview mode to review changes first",
  {
    title: z.string().describe("Title of the pull request"),
    description: z.string().optional().describe("Description/body of the pull request"),
    head: z
      .string()
      .optional()
      .describe("Branch name of the PR source (defaults to current branch)"),
    base: z
      .string()
      .optional()
      .describe("Branch name of the PR target (defaults to repo default branch)"),
    preview: z
      .boolean()
      .optional()
      .default(false)
      .describe("Show diff and commits without creating the PR"),
    assignees: z.string().optional().describe("Comma-separated list of usernames to assign"),
    labels: z.string().optional().describe("Comma-separated list of labels to assign"),
    milestone: z.string().optional().describe("Milestone to assign"),
  },
  async ({ title, description, head, base, preview, assignees, labels, milestone }) => {
    try {
      const sourceBranch = head || (await execGit(["branch", "--show-current"]));
      const targetBranch = base || "main";

      if (preview) {
        // Preview mode: show what would be included in the PR
        const previewData: string[] = [];

        previewData.push(`# PR Preview: ${title}`);
        previewData.push("");
        previewData.push(`**Source:** ${sourceBranch} → **Target:** ${targetBranch}`);
        previewData.push("");

        // Get commits
        try {
          const commits = await execGit(["log", `${targetBranch}..${sourceBranch}`, "--oneline"]);
          previewData.push("## Commits");
          if (commits) {
            previewData.push("```");
            previewData.push(commits);
            previewData.push("```");
          } else {
            previewData.push("*No commits found between branches*");
          }
        } catch (e) {
          previewData.push("## Commits");
          previewData.push(`*Error getting commits: ${(e as Error).message}*`);
        }

        previewData.push("");

        // Get diff stats
        try {
          const stats = await execGit(["diff", `${targetBranch}...${sourceBranch}`, "--stat"]);
          previewData.push("## Files Changed");
          if (stats) {
            previewData.push("```");
            previewData.push(stats);
            previewData.push("```");
          } else {
            previewData.push("*No file changes*");
          }
        } catch (e) {
          previewData.push("## Files Changed");
          previewData.push(`*Error getting stats: ${(e as Error).message}*`);
        }

        previewData.push("");

        // Get full diff
        try {
          const diff = await execGit(["diff", `${targetBranch}...${sourceBranch}`]);
          previewData.push("## Full Diff");
          if (diff) {
            previewData.push("```diff");
            previewData.push(diff);
            previewData.push("```");
          } else {
            previewData.push("*No changes to display*");
          }
        } catch (e) {
          previewData.push("## Full Diff");
          previewData.push(`*Error getting diff: ${(e as Error).message}*`);
        }

        previewData.push("");
        previewData.push("---");
        previewData.push(
          "To create this PR, call with `preview: false` (or omit the preview parameter)"
        );

        return {
          content: [{ type: "text" as const, text: previewData.join("\n") }],
        };
      }

      // Create mode: actually create the PR
      const args = ["pulls", "create", "--output", "json", "--title", title];

      if (description) args.push("--description", description);
      if (head) args.push("--head", head);
      if (base) args.push("--base", base);
      if (assignees) args.push("--assignees", assignees);
      if (labels) args.push("--labels", labels);
      if (milestone) args.push("--milestone", milestone);

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// Approve PR
server.tool(
  "pr_approve",
  "Approve a pull request",
  {
    index: z.number().positive().describe("Pull request number to approve"),
    comment: z.string().optional().describe("Optional approval comment"),
  },
  async ({ index, comment }) => {
    try {
      const args = ["pulls", "approve", String(index), "--output", "json"];
      if (comment) args.push(comment);

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// Reject PR (Request Changes)
server.tool(
  "pr_reject",
  "Request changes on a pull request",
  {
    index: z.number().positive().describe("Pull request number to reject"),
    reason: z.string().describe("Reason for requesting changes"),
  },
  async ({ index, reason }) => {
    try {
      const args = ["pulls", "reject", String(index), reason, "--output", "json"];

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// Merge PR
server.tool(
  "pr_merge",
  "Merge a pull request",
  {
    index: z.number().positive().describe("Pull request number to merge"),
    style: z
      .enum(["merge", "rebase", "squash", "rebase-merge"])
      .optional()
      .default("merge")
      .describe("Merge strategy to use"),
    title: z.string().optional().describe("Custom merge commit title"),
    message: z.string().optional().describe("Custom merge commit message"),
  },
  async ({ index, style, title, message }) => {
    try {
      const args = ["pulls", "merge", String(index), "--output", "json", "--style", style];
      if (title) args.push("--title", title);
      if (message) args.push("--message", message);

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// ============================================================
// REPOSITORY TOOLS
// ============================================================

// List repos
server.tool(
  "repos_list",
  "List repositories you have access to",
  {
    limit: z.number().min(1).max(100).optional().default(30),
    type: z.enum(["fork", "mirror", "source"]).optional(),
  },
  async ({ limit, type }) => {
    try {
      const args = ["repos", "list", "--output", "json", "--limit", String(limit)];
      if (type) args.push("--type", type);

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// View repo details
server.tool(
  "repo_view",
  "View details of a repository",
  {
    repo: z
      .string()
      .optional()
      .describe("Repository in 'owner/name' format (defaults to current repo)"),
  },
  async ({ repo }) => {
    try {
      const args = repo ? ["repos", repo, "--output", "json"] : ["repos", "--output", "json"];

      const result = await execTea(args);
      return {
        content: [{ type: "text" as const, text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
        isError: true,
      };
    }
  }
);

// ============================================================
// START SERVER
// ============================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("tea-mcp server running on stdio");
}

main().catch(console.error);
