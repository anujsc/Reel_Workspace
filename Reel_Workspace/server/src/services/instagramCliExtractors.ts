import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { MediaNotFoundError } from "../utils/errors.js";
import {
  ProcessSpawnError,
  runCommandWithTimeout,
  type CommandInvocation,
} from "./processRunner.js";
import type { InstagramMediaResult } from "./instagramFetcher.js";

type ExtractorStrategy = "yt-dlp" | "instaloader";

interface PythonCandidate {
  command: string;
  argsPrefix: string[];
}

interface ExtractorCommandErrorDetails {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  durationMs: number;
  stderr: string;
}

export class ExtractionStrategyError extends Error {
  public readonly strategy: ExtractorStrategy;
  public readonly details?: ExtractorCommandErrorDetails;

  constructor(
    strategy: ExtractorStrategy,
    message: string,
    details?: ExtractorCommandErrorDetails,
  ) {
    super(message);
    this.name = "ExtractionStrategyError";
    this.strategy = strategy;
    this.details = details;
  }
}

const TEMP_EXTRACT_ROOT = path.join(process.cwd(), "temp", "extractors");
const TEMP_VIDEO_DIR = path.join(process.cwd(), "temp", "videos");
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".mkv", ".webm", ".m4v"]);

function getExtractorTimeoutMs(strategy: ExtractorStrategy): number {
  const specificEnv =
    strategy === "yt-dlp"
      ? process.env.YTDLP_TIMEOUT_MS
      : process.env.INSTALOADER_TIMEOUT_MS;
  const fallback = process.env.EXTRACTOR_TIMEOUT_MS;
  const parsed = Number.parseInt(specificEnv || fallback || "120000", 10);
  if (Number.isNaN(parsed) || parsed < 1000) {
    return 120000;
  }
  return parsed;
}

function getMaxVideoSizeBytes(): number {
  const configuredMb = Number.parseInt(
    process.env.EXTRACT_MAX_FILE_SIZE_MB || "",
    10,
  );

  if (!Number.isNaN(configuredMb) && configuredMb > 0) {
    return configuredMb * 1024 * 1024;
  }

  return process.env.NODE_ENV === "production"
    ? 50 * 1024 * 1024
    : 200 * 1024 * 1024;
}

function getMaxVideoSizeMb(): number {
  return Math.floor(getMaxVideoSizeBytes() / (1024 * 1024));
}

function getExtractorProxy(): string | undefined {
  const proxy = process.env.EXTRACTOR_PROXY?.trim();
  return proxy || undefined;
}

function sanitizeLogText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 400);
}

function sanitizeError(error: unknown): string {
  if (!error) return "Unknown error";
  const message = error instanceof Error ? error.message : String(error);
  return sanitizeLogText(message);
}

function buildTempId(prefix: string): string {
  const random = randomBytes(4).toString("hex");
  return `${prefix}_${Date.now()}_${random}`;
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function cleanupDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures.
  }
}

async function statIfExists(filePath: string): Promise<{ size: number } | null> {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return null;
    }
    return { size: stats.size };
  } catch {
    return null;
  }
}

async function walkFiles(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function findLargestVideoFile(rootDir: string): Promise<string | null> {
  const files = await walkFiles(rootDir);
  let selected: { path: string; size: number } | null = null;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!VIDEO_EXTENSIONS.has(ext)) {
      continue;
    }

    const stats = await statIfExists(filePath);
    if (!stats) continue;

    if (!selected || stats.size > selected.size) {
      selected = { path: filePath, size: stats.size };
    }
  }

  return selected?.path || null;
}

async function moveToPipelineVideoDir(sourcePath: string): Promise<string> {
  await ensureDir(TEMP_VIDEO_DIR);
  const sourceExt = path.extname(sourcePath).toLowerCase() || ".mp4";
  const fileName = `video_${Date.now()}_${randomBytes(3).toString("hex")}${sourceExt}`;
  const targetPath = path.join(TEMP_VIDEO_DIR, fileName);

  try {
    await fs.rename(sourcePath, targetPath);
  } catch {
    await fs.copyFile(sourcePath, targetPath);
    await fs.unlink(sourcePath);
  }

  return targetPath;
}

function buildPythonCandidates(): PythonCandidate[] {
  const candidates: PythonCandidate[] = [];
  const configured = process.env.PYTHON_EXECUTABLE?.trim();

  if (configured) {
    candidates.push({ command: configured, argsPrefix: [] });
  }

  candidates.push({ command: "python3", argsPrefix: [] });
  candidates.push({ command: "python", argsPrefix: [] });

  if (process.platform === "win32") {
    candidates.push({ command: "py", argsPrefix: ["-3"] });
  }

  return candidates;
}

function getScriptPath(scriptName: string): string {
  return path.join(process.cwd(), "scripts", scriptName);
}

async function runFirstAvailableCommand(
  strategy: ExtractorStrategy,
  candidates: CommandInvocation[],
  timeoutMs: number,
): Promise<{
  command: CommandInvocation;
  result: Awaited<ReturnType<typeof runCommandWithTimeout>>;
}> {
  let lastSpawnError: ProcessSpawnError | null = null;

  const looksUnavailable = (result: {
    exitCode: number | null;
    timedOut: boolean;
    stderr: string;
    stdout: string;
  }): boolean => {
    if (result.timedOut) return false;
    if (result.exitCode === 0) return false;

    const combined = `${result.stderr}\n${result.stdout}`.toLowerCase();
    return (
      result.exitCode === 9009 ||
      result.exitCode === 127 ||
      combined.includes("command not found") ||
      combined.includes("is not recognized as an internal") ||
      combined.includes("python was not found") ||
      combined.includes("no module named")
    );
  };

  for (const candidate of candidates) {
    try {
      const result = await runCommandWithTimeout(candidate, {
        timeoutMs,
        maxOutputChars: 20000,
      });

      if (looksUnavailable(result)) {
        continue;
      }

      return { command: candidate, result };
    } catch (error) {
      if (error instanceof ProcessSpawnError && error.code === "ENOENT") {
        lastSpawnError = error;
        continue;
      }

      throw new ExtractionStrategyError(
        strategy,
        sanitizeError(error),
        undefined,
      );
    }
  }

  throw new ExtractionStrategyError(
    strategy,
    `No runnable command found (${sanitizeError(lastSpawnError)})`,
  );
}

function createCommandError(
  strategy: ExtractorStrategy,
  result: Awaited<ReturnType<typeof runCommandWithTimeout>>,
): ExtractionStrategyError {
  const stderr = sanitizeLogText(result.stderr || result.stdout || "");
  const timeoutMsg = result.timedOut ? "Process timed out" : "Command failed";

  return new ExtractionStrategyError(
    strategy,
    `${timeoutMsg} (exit=${result.exitCode ?? "null"}, signal=${result.signal ?? "none"})`,
    {
      exitCode: result.exitCode,
      signal: result.signal,
      timedOut: result.timedOut,
      durationMs: result.durationMs,
      stderr,
    },
  );
}

function extractShortcodeFromUrl(url: string): string {
  const parsed = new URL(url);
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new MediaNotFoundError("Invalid Instagram path format");
  }

  return segments[1];
}

async function enforceFileSizeLimit(
  strategy: ExtractorStrategy,
  filePath: string,
): Promise<void> {
  const stats = await fs.stat(filePath);
  const maxBytes = getMaxVideoSizeBytes();

  if (stats.size > maxBytes) {
    throw new ExtractionStrategyError(
      strategy,
      `Extracted file exceeds limit: ${(stats.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }
}

export async function extractWithYtDlp(
  cleanUrl: string,
): Promise<InstagramMediaResult> {
  const strategy: ExtractorStrategy = "yt-dlp";
  const timeoutMs = getExtractorTimeoutMs(strategy);
  const workingDir = path.join(TEMP_EXTRACT_ROOT, buildTempId("ytdlp"));
  await ensureDir(workingDir);

  try {
    const outputTemplate = path.join(workingDir, "reel.%(ext)s");
    const maxSizeMb = getMaxVideoSizeMb();
    const pythonYtDlpScript = getScriptPath("ytdlp_extract.py");
    const extractorProxy = getExtractorProxy();
    const commonArgs = [
      "--no-playlist",
      "--no-progress",
      "--no-warnings",
      "--restrict-filenames",
      "--force-ipv4",
      "--socket-timeout",
      "20",
      "--retries",
      "3",
      "--fragment-retries",
      "3",
      "--max-filesize",
      `${maxSizeMb}M`,
      "--merge-output-format",
      "mp4",
      "--output",
      outputTemplate,
    ];
    const proxyArgs = extractorProxy ? ["--proxy", extractorProxy] : [];

    const configuredYtDlp = process.env.YTDLP_EXECUTABLE?.trim();
    const ytCandidates: CommandInvocation[] = [];

    if (configuredYtDlp) {
      ytCandidates.push({
        command: configuredYtDlp,
        args: [
          ...commonArgs,
          ...proxyArgs,
          cleanUrl,
        ],
      });
    }

    for (const python of buildPythonCandidates()) {
      ytCandidates.push({
        command: python.command,
        args: [
          ...python.argsPrefix,
          pythonYtDlpScript,
          ...commonArgs,
          ...proxyArgs,
          cleanUrl,
        ],
      });
    }

    ytCandidates.push({
      command: "yt-dlp",
      args: [
        ...commonArgs,
        ...proxyArgs,
        cleanUrl,
      ],
    });

    const { result } = await runFirstAvailableCommand(
      strategy,
      ytCandidates,
      timeoutMs,
    );

    if (result.timedOut || result.exitCode !== 0) {
      throw createCommandError(strategy, result);
    }

    const downloadedFile = await findLargestVideoFile(workingDir);
    if (!downloadedFile) {
      throw new ExtractionStrategyError(
        strategy,
        "yt-dlp completed without producing a video file",
      );
    }

    await enforceFileSizeLimit(strategy, downloadedFile);

    const finalPath = await moveToPipelineVideoDir(downloadedFile);

    return {
      source: strategy,
      sourceUrl: cleanUrl,
      videoUrl: cleanUrl,
      localFilePath: finalPath,
    };
  } catch (error) {
    throw error instanceof ExtractionStrategyError
      ? error
      : new ExtractionStrategyError(strategy, sanitizeError(error));
  } finally {
    await cleanupDir(workingDir);
  }
}

export async function extractWithInstaloader(
  cleanUrl: string,
): Promise<InstagramMediaResult> {
  const strategy: ExtractorStrategy = "instaloader";
  const timeoutMs = getExtractorTimeoutMs(strategy);
  const workingDir = path.join(TEMP_EXTRACT_ROOT, buildTempId("instaloader"));
  await ensureDir(workingDir);

  try {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "instaloader_extract.py",
    );

    const shortcode = extractShortcodeFromUrl(cleanUrl);
    const extractorProxy = getExtractorProxy();

    const commands: CommandInvocation[] = [];

    for (const python of buildPythonCandidates()) {
      commands.push({
        command: python.command,
        args: [
          ...python.argsPrefix,
          scriptPath,
          "--url",
          cleanUrl,
          "--output-dir",
          workingDir,
          ...(extractorProxy ? ["--proxy", extractorProxy] : []),
        ],
      });
    }

    const { result } = await runFirstAvailableCommand(
      strategy,
      commands,
      timeoutMs,
    );

    if (result.timedOut || result.exitCode !== 0) {
      throw createCommandError(strategy, result);
    }

    const outputLines = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const lastLine = outputLines[outputLines.length - 1];
    if (!lastLine) {
      throw new ExtractionStrategyError(
        strategy,
        "Instaloader returned no parsable output",
      );
    }

    let parsed: {
      videoPath?: string;
      title?: string;
      caption?: string;
    };

    try {
      parsed = JSON.parse(lastLine);
    } catch {
      throw new ExtractionStrategyError(
        strategy,
        "Instaloader output JSON parse failed",
      );
    }

    const extractedVideo = parsed.videoPath || (await findLargestVideoFile(workingDir));
    if (!extractedVideo) {
      throw new ExtractionStrategyError(
        strategy,
        "Instaloader completed without producing a video file",
      );
    }

    await enforceFileSizeLimit(strategy, extractedVideo);

    const finalPath = await moveToPipelineVideoDir(extractedVideo);

    return {
      source: strategy,
      sourceUrl: cleanUrl,
      videoUrl: cleanUrl,
      localFilePath: finalPath,
      title: parsed.title || shortcode,
      description: parsed.caption,
    };
  } catch (error) {
    throw error instanceof ExtractionStrategyError
      ? error
      : new ExtractionStrategyError(strategy, sanitizeError(error));
  } finally {
    await cleanupDir(workingDir);
  }
}