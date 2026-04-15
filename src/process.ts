import { spawn } from "child_process";

export interface CommandResult {
  stdout: string;
  stderr: string;
}

export interface CommandOptions {
  cwd?: string;
}

const MAX_BUFFER_BYTES = 10 * 1024 * 1024;

export function execCommand(
  file: string,
  args: string[],
  options?: CommandOptions
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      cwd: options?.cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let stdoutLen = 0;
    let stderrLen = 0;

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutLen += chunk.length;
      if (stdoutLen <= MAX_BUFFER_BYTES) {
        stdout += chunk.toString();
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrLen += chunk.length;
      if (stderrLen <= MAX_BUFFER_BYTES) {
        stderr += chunk.toString();
      }
    });

    child.on("error", (error) => {
      reject(new Error(error.message));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const details = [stderr, stdout, `Process exited with code ${code}`]
          .filter(Boolean)
          .join("\n");
        reject(new Error(details));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
