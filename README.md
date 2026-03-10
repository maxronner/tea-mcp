# @maxronner/tea-mcp

[![CI](https://github.com/maxronner/tea-mcp/workflows/CI/badge.svg)](https://github.com/maxronner/tea-mcp/actions)
[![npm version](https://badge.fury.io/js/@maxronner%2Ftea-mcp.svg)](https://badge.fury.io/js/@maxronner%2Ftea-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for [tea CLI](https://gitea.io) - interact with Gitea repositories, issues, and pull requests from AI assistants.

## Features

- List, view, close, and reopen issues
- List, view, and checkout pull requests
- **Create pull requests with preview mode** - review changes before creating
- **Approve and reject pull requests** - complete PR review workflow
- **Merge pull requests** - with multiple merge strategies (merge, squash, rebase)
- List and view repository details
- Full integration with MCP-compatible AI tools

## Prerequisites

- Node.js 18+
- [tea CLI](https://gitea.io/en-us/) installed and configured with your Gitea instance

## Installation

### Option 1: NPX (Recommended)

```bash
npx @maxronner/tea-mcp
```

### Option 2: Global Install

```bash
# Using npm
npm install -g @maxronner/tea-mcp

# Using bun
bun install -g @maxronner/tea-mcp
```

### Option 3: Use with MCP Client

Add to your MCP client configuration (e.g., Claude Desktop, Cline):

```json
{
  "mcpServers": {
    "tea": {
      "command": "npx",
      "args": ["@maxronner/tea-mcp"]
    }
  }
}
```

## Available Tools

### Issue Tools

#### `tea_issues_list`

List issues in the current repository.

**Parameters:**

- `state` (optional): "open" | "closed" | "all" (default: "open")
- `limit` (optional): 1-100 (default: 30)
- `labels` (optional): Filter by labels (comma-separated)
- `author` (optional): Filter by author

#### `tea_issue_view`

View details of a specific issue.

**Parameters:**

- `index` (required): Issue number

#### `tea_issue_close`

Close an issue.

**Parameters:**

- `index` (required): Issue number

#### `tea_issue_reopen`

Reopen a closed issue.

**Parameters:**

- `index` (required): Issue number

### Pull Request Tools

#### `tea_prs_list`

List pull requests in the current repository.

**Parameters:**

- `state` (optional): "open" | "closed" | "all" (default: "open")
- `limit` (optional): 1-100 (default: 30)

#### `tea_pr_view`

View details of a specific pull request.

**Parameters:**

- `index` (required): Pull request number

#### `tea_pr_checkout`

Checkout a pull request locally.

**Parameters:**

- `index` (required): Pull request number to checkout

#### `tea_pr_create`

Create a new pull request with optional preview mode.

**Parameters:**

- `title` (required): Pull request title
- `description` (optional): PR body/description
- `head` (optional): Source branch name (defaults to current branch)
- `base` (optional): Target branch name (defaults to repo default branch)
- `preview` (optional): Show diff without creating PR (default: false)
- `assignees` (optional): Comma-separated usernames to assign
- `labels` (optional): Comma-separated labels to assign
- `milestone` (optional): Milestone to assign

**Usage:**

```javascript
// Preview what the PR will include
{ "title": "My Feature", "preview": true }

// Create the actual PR
{ "title": "My Feature", "description": "Adds cool feature", "base": "main" }
```

#### `tea_pr_approve`

Approve a pull request.

**Parameters:**

- `index` (required): Pull request number to approve
- `comment` (optional): Approval comment

**Example:**

```javascript
{ "index": 42, "comment": "LGTM! Great work." }
```

#### `tea_pr_reject`

Request changes on a pull request.

**Parameters:**

- `index` (required): Pull request number to reject
- `reason` (required): Reason for requesting changes

**Example:**

```javascript
{ "index": 42, "reason": "Please fix the variable naming convention" }
```

#### `tea_pr_merge`

Merge a pull request.

**Parameters:**

- `index` (required): Pull request number to merge
- `style` (optional): Merge strategy - "merge" | "rebase" | "squash" | "rebase-merge" (default: "merge")
- `title` (optional): Custom merge commit title
- `message` (optional): Custom merge commit message

**Example:**

```javascript
// Standard merge
{ "index": 42 }

// Squash merge with custom message
{ "index": 42, "style": "squash", "message": "Squashed feature commits" }
```

### Repository Tools

#### `tea_repos_list`

List repositories you have access to.

**Parameters:**

- `limit` (optional): 1-100 (default: 30)
- `type` (optional): "fork" | "mirror" | "source"

#### `tea_repo_view`

View details of a repository.

**Parameters:**

- `repo` (optional): Repository in "owner/name" format (defaults to current repo)

## Development

### Setup

```bash
git clone https://github.com/maxronner/tea-mcp.git
cd tea-mcp
bun install
```

### Commands

```bash
bun run build        # Build TypeScript
bun test             # Run tests in watch mode
bun run test:run     # Run tests once
bun run test:coverage # Run tests with coverage
bun run lint         # Run ESLint
bun run lint:fix     # Fix lint issues
bun run format       # Format with Prettier
bun run typecheck    # Type check without emit
```

### Testing

This project uses Vitest with mocked child_process to test without requiring the tea CLI.

Coverage threshold: 80%

## Important Notes

### Self-Approval in Gitea

**Gitea allows PR authors to approve their own pull requests by default.** This is different from GitHub's default behavior. Here's what you need to know:

- **Default behavior**: PR authors can approve their own PRs, and these approvals count toward any required approval count
- **Branch protection**: To enforce proper review workflows, use branch protection rules:
  - Set "Required approving reviews" to a higher number (e.g., 2+) to ensure external review
  - Enable "Require review from Code Owners" and define a `CODEOWNERS` file
  - Consider enabling `BlockAdminMergeOverride` to prevent even admins from bypassing rules

### Recommended Branch Protection Setup

1. Navigate to Repository Settings → Branches → Branch Protection Rules
2. Enable "Require pull request reviews before merging"
3. Set "Required approving reviews" to at least 2
4. Create a `.gitea/CODEOWNERS` file:

```
# Default reviewers for all changes
* @team-lead @senior-devs

# Specific paths require specific reviewers
/src/**/*.ts @typescript-maintainers
/docs/** @documentation-team
```

5. Enable "Require review from Code Owners" in branch protection

This ensures proper code review even when working solo or in small teams.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and ensure tests pass: `bun run test:run`
4. Commit with conventional commits
5. Push and create a pull request

## License

MIT (c) Max Ronner

## Links

- [GitHub Repository](https://github.com/maxronner/tea-mcp)
- [npm Package](https://www.npmjs.com/package/@maxronner/tea-mcp)
- [Report Issues](https://github.com/maxronner/tea-mcp/issues)
- [MCP Documentation](https://modelcontextprotocol.io)
- [tea CLI Documentation](https://gitea.io/en-us/)
