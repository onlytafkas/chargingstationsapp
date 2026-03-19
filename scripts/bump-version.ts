import fs from "fs";
import path from "path";
import { bumpSemVer, type ReleaseType, validateSemVer } from "../lib/version";

type PackageJson = {
  version: string;
  [key: string]: unknown;
};

const packageJsonPath = path.resolve(__dirname, "../package.json");
const releaseType = process.argv[2] as ReleaseType | undefined;

if (!releaseType || !["patch", "minor", "major"].includes(releaseType)) {
  console.error("Usage: tsx scripts/bump-version.ts <patch|minor|major>");
  process.exit(1);
}

const packageJson = JSON.parse(
  fs.readFileSync(packageJsonPath, "utf-8")
) as PackageJson;

const currentVersion = validateSemVer(packageJson.version);
const nextVersion = bumpSemVer(currentVersion, releaseType);

packageJson.version = nextVersion;

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`Version bumped: ${currentVersion} -> ${nextVersion}`);