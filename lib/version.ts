import packageJson from "@/package.json";

export const APP_NAME = "Charging Stations App";
export type ReleaseType = "patch" | "minor" | "major";

// Official SemVer 2.0.0 regex from semver.org (ECMAScript-compatible variant).
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export function validateSemVer(version: string): string {
  if (!SEMVER_REGEX.test(version)) {
    throw new Error(
      `Invalid semantic version \"${version}\". Expected SemVer 2.0.0 format X.Y.Z with optional prerelease/build metadata.`
    );
  }

  return version;
}

export function bumpSemVer(version: string, releaseType: ReleaseType): string {
  const validatedVersion = validateSemVer(version);
  const [coreVersion] = validatedVersion.split("-");
  const [major, minor, patch] = coreVersion.split(".").map(Number);

  switch (releaseType) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default: {
      const exhaustiveCheck: never = releaseType;
      throw new Error(`Unsupported release type: ${exhaustiveCheck}`);
    }
  }
}

export const appVersion = validateSemVer(packageJson.version);
export const appVersionLabel = `v${appVersion}`;
export const appNameWithVersion = `${APP_NAME} ${appVersionLabel}`;