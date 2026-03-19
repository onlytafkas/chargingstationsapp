import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const hooksPath = path.join(repoRoot, ".githooks");

if (!existsSync(path.join(repoRoot, ".git"))) {
  console.log("Skipping Git hook installation because this directory is not a Git repository.");
  process.exit(0);
}

if (!existsSync(hooksPath)) {
  console.log("Skipping Git hook installation because .githooks does not exist.");
  process.exit(0);
}

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Configured Git hooks to use .githooks.");