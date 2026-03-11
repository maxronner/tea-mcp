import { fileURLToPath } from "url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execCommand } from "./process.js";

type TeaResponse =
  | string
  | { success: true; message?: string; stderr?: string }
  | object
  | unknown[];

interface RegisteredToolRecord {
  handler: (
    args: unknown
  ) => Promise<{ content: { type: "text"; text: string }[]; isError?: true }>;
}

export const server = new McpServer({
  name: "tea",
  version: "1.0.0",
});

function formatResponse(data: TeaResponse): string {
  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object") {
    if (Array.isArray(data) && data.length === 0) {
      return "No results found";
    }

    if ("success" in data && data.success === true && Object.keys(data).length === 1) {
      return "Operation completed successfully";
    }
  }

  return JSON.stringify(data, null, 2);
}

function formatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `Error: ${message}`;
}

export async function execTea(args: string[]): Promise<TeaResponse> {
  const { stdout, stderr } = await execCommand("tea", args);
  const output = stdout.trim();

  if (!output) {
    return { success: true };
  }

  try {
    return JSON.parse(output) as TeaResponse;
  } catch {
    return { success: true, message: output, stderr };
  }
}

export async function execGit(args: string[]): Promise<string> {
  const { stdout } = await execCommand("git", args);
  return stdout.trim();
}

export async function resolveDefaultBranch(): Promise<string> {
  try {
    const remoteHead = await execGit(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]);
    if (remoteHead.startsWith("origin/")) {
      return remoteHead.slice("origin/".length);
    }
    if (remoteHead) {
      return remoteHead;
    }
  } catch {
    // Fall back to parsing `git remote show origin`.
  }

  try {
    const remoteInfo = await execGit(["remote", "show", "origin"]);
    const match = remoteInfo.match(/HEAD branch: ([^\n]+)/);
    if (match?.[1]) {
      return match[1].trim();
    }
  } catch {
    // Fall back to a conservative default.
  }

  return "main";
}

export function getRegisteredToolNames(): string[] {
  return Object.keys(
    (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools
  );
}

export function getRegisteredTool(name: string): RegisteredToolRecord {
  return (server as unknown as { _registeredTools: Record<string, RegisteredToolRecord> })
    ._registeredTools[name];
}

server.tool(
  "tea_issues_list",
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

server.tool(
  "tea_issue_view",
  "View details of a specific issue",
  {
    index: z.number().positive().describe("Issue number"),
  },
  async ({ index }) => {
    try {
      const result = await execTea(["issues", String(index), "--output", "json", "--comments"]);
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

server.tool(
  "tea_issue_close",
  "Close an issue",
  {
    index: z.number().positive().describe("Issue number to close"),
  },
  async ({ index }) => {
    try {
      const result = await execTea(["issues", "close", String(index)]);
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

server.tool(
  "tea_issue_reopen",
  "Reopen a closed issue",
  {
    index: z.number().positive().describe("Issue number to reopen"),
  },
  async ({ index }) => {
    try {
      const result = await execTea(["issues", "reopen", String(index)]);
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

server.tool(
  "tea_prs_list",
  "List pull requests in the current repository",
  {
    state: z.enum(["open", "closed", "all"]).optional().default("open"),
    limit: z.number().min(1).max(100).optional().default(30),
  },
  async ({ state, limit }) => {
    try {
      const result = await execTea([
        "pulls",
        "list",
        "--output",
        "json",
        "--state",
        state,
        "--limit",
        String(limit),
      ]);
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

server.tool(
  "tea_pr_view",
  "View details of a specific pull request",
  {
    index: z.number().positive().describe("Pull request number"),
  },
  async ({ index }) => {
    try {
      const result = await execTea(["pulls", String(index), "--output", "json", "--comments"]);
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

server.tool(
  "tea_pr_checkout",
  "Checkout a pull request locally",
  {
    index: z.number().positive().describe("Pull request number to checkout"),
  },
  async ({ index }) => {
    try {
      const result = await execTea(["pulls", "checkout", String(index)]);
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

server.tool(
  "tea_pr_create",
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
      const targetBranch = base || (await resolveDefaultBranch());

      if (preview) {
        const previewData: string[] = [];

        previewData.push(`# PR Preview: ${title}`);
        previewData.push("");
        previewData.push(`**Source:** ${sourceBranch} -> **Target:** ${targetBranch}`);
        previewData.push("");

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
        } catch (error) {
          previewData.push("## Commits");
          previewData.push(`*Error getting commits: ${formatError(error).replace("Error: ", "")}*`);
        }

        previewData.push("");

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
        } catch (error) {
          previewData.push("## Files Changed");
          previewData.push(`*Error getting stats: ${formatError(error).replace("Error: ", "")}*`);
        }

        previewData.push("");

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
        } catch (error) {
          previewData.push("## Full Diff");
          previewData.push(`*Error getting diff: ${formatError(error).replace("Error: ", "")}*`);
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

      const args = ["pulls", "create", "--output", "json", "--title", title];

      if (description) args.push("--description", description);
      if (head) args.push("--head", head);
      if (base) {
        args.push("--base", base);
      } else {
        args.push("--base", targetBranch);
      }
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

server.tool(
  "tea_pr_approve",
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

server.tool(
  "tea_pr_reject",
  "Request changes on a pull request",
  {
    index: z.number().positive().describe("Pull request number to reject"),
    reason: z.string().describe("Reason for requesting changes"),
  },
  async ({ index, reason }) => {
    try {
      const result = await execTea(["pulls", "reject", String(index), reason, "--output", "json"]);
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

server.tool(
  "tea_pr_merge",
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

server.tool(
  "tea_repos_list",
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

server.tool(
  "tea_repo_view",
  "View details of a repository",
  {
    repo: z
      .string()
      .optional()
      .describe("Repository in 'owner/name' format (defaults to current repo)"),
  },
  async ({ repo }) => {
    try {
      const result = await execTea(
        repo ? ["repos", repo, "--output", "json"] : ["repos", "--output", "json"]
      );
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

export async function startServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("tea-mcp server running on stdio");
}

export function isMainModule(moduleUrl: string): boolean {
  const entryPath = process.argv[1];
  return Boolean(entryPath) && fileURLToPath(moduleUrl) === entryPath;
}
