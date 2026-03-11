import { execFile } from "child_process";

export interface CommandResult {
  stdout: string;
  stderr: string;
}

const MAX_BUFFER_BYTES = 10 * 1024 * 1024;

export function execCommand(file: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { maxBuffer: MAX_BUFFER_BYTES }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}
