import { spawn } from "node:child_process";

export interface CommandInvocation {
  command: string;
  args: string[];
}

export interface ProcessRunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs: number;
  maxOutputChars?: number;
}

export interface ProcessRunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export class ProcessSpawnError extends Error {
  public readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ProcessSpawnError";
    this.code = code;
  }
}

function appendBounded(
  current: string,
  chunk: string,
  maxChars: number,
): string {
  if (!chunk) return current;
  const combined = `${current}${chunk}`;
  if (combined.length <= maxChars) {
    return combined;
  }

  return combined.slice(combined.length - maxChars);
}

function terminateProcessTree(pid: number): void {
  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });

    killer.on("error", () => {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // Ignore kill failures if process already exited.
      }
    });
    return;
  }

  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // Ignore kill failures if process already exited.
    }
  }
}

export async function runCommandWithTimeout(
  invocation: CommandInvocation,
  options: ProcessRunOptions,
): Promise<ProcessRunResult> {
  const maxOutputChars = options.maxOutputChars ?? 16000;

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn(invocation.command, invocation.args, {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      if (child.pid) {
        terminateProcessTree(child.pid);
      }
    }, options.timeoutMs);

    child.stdout.on("data", (data: Buffer) => {
      stdout = appendBounded(stdout, data.toString("utf8"), maxOutputChars);
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr = appendBounded(stderr, data.toString("utf8"), maxOutputChars);
    });

    child.once("error", (error: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      reject(
        new ProcessSpawnError(
          `Failed to start process '${invocation.command}': ${error.message}`,
          error.code,
        ),
      );
    });

    child.once("close", (exitCode, signal) => {
      clearTimeout(timeout);
      resolve({
        exitCode,
        signal,
        timedOut,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
      });
    });
  });
}