import { execFile } from "child_process";

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
    execFile(
      file,
      args,
      { maxBuffer: MAX_BUFFER_BYTES, cwd: options?.cwd },
      (error, stdout, stderr) => {
        if (error) {
          const details = [stderr, stdout, error.message].filter(Boolean).join("\n");
          reject(new Error(details));
          return;
        }

        resolve({ stdout, stderr });
      }
    );
  });
}
