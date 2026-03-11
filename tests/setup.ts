import { mock } from "bun:test";
import type { ExecFileException } from "child_process";

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
  execFile: mock(
    (
      file: string,
      args: string[],
      options: unknown,
      callback: (error: ExecFileException | null, stdout: string, stderr: string) => void
    ) => {
      void options;
      execCalls.push({ file, args });

      const next = execResults.shift();
      if (!next) {
        callback(null, "", "");
        return undefined as never;
      }

      if (next.type === "error") {
        const error = new Error(next.stderr) as ExecFileException & { code?: number };
        error.code = next.exitCode;
        callback(error, "", next.stderr);
        return undefined as never;
      }

      callback(null, next.stdout, next.stderr);
      return undefined as never;
    }
  ),
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
