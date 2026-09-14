#!/usr/bin/env node
/**
 * afterFileEdit formatter. Fail-open: always exit 0. Format the edited file only.
 * stdout stays empty so formatter I/O never enters the agent context.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, isAbsolute, relative, resolve } from "node:path";

const ALLOWED = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".md",
]);

const ESLINT_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function readPayload() {
  try {
    const raw = readFileSync(0, "utf8").trim();
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveFile(filePath) {
  if (typeof filePath !== "string" || !filePath) return null;
  const abs = isAbsolute(filePath)
    ? filePath
    : resolve(process.cwd(), filePath);
  const rel = relative(process.cwd(), abs);
  if (rel.startsWith("..") || rel === "") return null;
  if (!existsSync(abs)) return null;
  return abs;
}

function run(bin, args) {
  return spawnSync(bin, args, {
    cwd: process.cwd(),
    stdio: ["ignore", "ignore", "ignore"],
    shell: process.platform === "win32",
    timeout: 15000,
  });
}

function formatFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!ALLOWED.has(ext)) return;

  const prettier = run("npx", ["prettier", "--write", filePath]);
  if (prettier.status === 0) return;

  if (ESLINT_EXTS.has(ext)) {
    run("npx", ["eslint", "--fix", filePath]);
  }
}

try {
  const payload = readPayload();
  const filePath = resolveFile(payload?.file_path);
  if (filePath) formatFile(filePath);
} catch {
  // fail-open
}

process.exit(0);
