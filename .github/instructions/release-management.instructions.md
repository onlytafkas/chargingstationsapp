---
description: Use when a change affects fixes, features, breaking changes, package.json version updates, release notes, or visible product versioning.
---

# Release Management Guidelines

## Semantic Versioning

This project uses Semantic Versioning 2.0.0 from https://semver.org/.

- Use `PATCH` for backward-compatible fixes.
- Use `MINOR` for backward-compatible features.
- Use `MAJOR` for breaking changes.
- Do not use ad hoc version formats; the canonical stored version must remain `X.Y.Z` with valid SemVer semantics.

## When To Update Versioning

Update versioning whenever a suggestion or implementation changes the product meaning in one of these ways:

- Fixes an existing defect that changes shipped behaviour
- Adds or expands a user-visible or API-visible feature
- Introduces a breaking change in behaviour, contract, or expected usage

If a change does not affect released behaviour, explain why no version bump is needed.

## Source Of Truth

- `package.json` is the canonical source of the application version.
- Any UI that displays the app version must read from the centralized version utility rather than hardcoding the value.
- If release notes mention a version, they must match `package.json` exactly.

## Release Notes

- Add or update release notes in `README.md` for meaningful release-facing changes.
- Keep release notes concise and grouped by released version.
- Mention the high-level change, not internal refactors unless they affect release consumers or delivery reliability.

## Required Checks

- Verify the version string remains valid SemVer 2.0.0.
- Ensure the visible version label and release notes stay in sync with `package.json`.
- For breaking changes, state clearly that the change requires a major-version bump.