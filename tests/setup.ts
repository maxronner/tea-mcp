import { mock } from "bun:test";
import type { ExecException } from "child_process";

export function mockExecSuccess(stdout: string, stderr: string = "") {
  mock.module("child_process", () => ({
    exec: mock((cmd: string, options: any, callback: any) => {
      if (typeof options === "function") {
        callback = options;
      }
      callback(null, stdout, stderr);
      return undefined as any;
    }),
  }));
}

export function mockExecError(exitCode: number, stderr: string) {
  mock.module("child_process", () => ({
    exec: mock((cmd: string, options: any, callback: any) => {
      if (typeof options === "function") {
        callback = options;
      }
      const error = new Error(stderr) as ExecException;
      (error as any).code = exitCode;
      callback(error, "", stderr);
      return undefined as any;
    }),
  }));
}

export function mockExecEmpty() {
  mock.module("child_process", () => ({
    exec: mock((cmd: string, options: any, callback: any) => {
      if (typeof options === "function") {
        callback = options;
      }
      callback(null, "", "");
      return undefined as any;
    }),
  }));
}

export function mockExecNonJson(output: string) {
  mock.module("child_process", () => ({
    exec: mock((cmd: string, options: any, callback: any) => {
      if (typeof options === "function") {
        callback = options;
      }
      callback(null, output, "");
      return undefined as any;
    }),
  }));
}

export function resetMocks() {
  mock.restore();
}
