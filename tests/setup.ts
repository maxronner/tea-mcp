import { mock } from "bun:test";
import { EventEmitter } from "events";

interface ExecCall {
  file: string;
  args: string[];
}

type ExecMockResult =
  | { type: "success"; stdout: string; stderr: string }
  | { type: "error"; exitCode: number; stderr: string };

const execCalls: ExecCall[] = [];
const execResults: ExecMockResult[] = [];

mock.module("child_process", () => ({
  spawn: mock((file: string, args: string[], _options: unknown) => {
    execCalls.push({ file, args });

    const child = new EventEmitter();
    const stdoutStream = new EventEmitter();
    const stderrStream = new EventEmitter();
    (child as any).stdout = stdoutStream;
    (child as any).stderr = stderrStream;

    const next = execResults.shift();

    queueMicrotask(() => {
      if (!next) {
        child.emit("close", 0);
        return;
      }

      if (next.type === "error") {
        if (next.stderr) {
          stderrStream.emit("data", Buffer.from(next.stderr));
        }
        child.emit("close", next.exitCode);
        return;
      }

      if (next.stdout) {
        stdoutStream.emit("data", Buffer.from(next.stdout));
      }
      if (next.stderr) {
        stderrStream.emit("data", Buffer.from(next.stderr));
      }
      child.emit("close", 0);
    });

    return child;
  }),
}));

export function queueExecSuccess(stdout: string, stderr = ""): void {
  execResults.push({ type: "success", stdout, stderr });
}

export function queueExecError(exitCode: number, stderr: string): void {
  execResults.push({ type: "error", exitCode, stderr });
}

export function resetExecMocks(): void {
  execCalls.length = 0;
  execResults.length = 0;
}

export function getExecCalls(): ExecCall[] {
  return execCalls;
}

const FAKE_REMOTE = "ssh://git@git.example.com/owner/repo.git";

export function queueRepoDetection(): void {
  queueExecSuccess(FAKE_REMOTE);
}

export function repoDetectionCall(): ExecCall {
  return { file: "git", args: ["remote", "get-url", "origin"] };
}

export const RESOLVED_REPO_SLUG = "owner/repo";
