# SPEC-012 - Buildx Platform Verification Reliability

## Status

Approved

## Date

2026-08-19

## Purpose

Correct the Docker publication workflow so its required Buildx platform check
does not report a platform as unavailable when Buildx advertises it.

## Requested Behavior

- Preserve fail-closed verification for `linux/arm64` and `linux/arm/v6`.
- Inspect the configured Buildx builder once.
- Test both required platform strings without a producer-to-`grep -q` pipeline
  that can fail under `set -o pipefail` after a successful early match.
- Preserve all existing publication triggers, action pins, credentials, image
  tags, registry target, platform order, caching, and build behavior.

## Scope

- `.github/workflows/publish-docker-images.yml`
- Active-spec index in `AGENTS.md`
- This completed-work spec and plan

## Out Of Scope

- Changing the required publication platforms.
- Changing Docker build or image runtime behavior.
- Creating or rerunning a GitHub Actions release.
- Creating automated workflow tests, which project policy prohibits.

## Definitions

- **False negative:** The platform verification step fails even though the
  Buildx inspection output contains the required platform.

## Inputs And Constraints

- The workflow continues to run Bash with `set -euo pipefail`.
- Buildx inspection output remains the source of truth for platform support.
- Both existing missing-platform error messages remain operator-visible.
- The correction implements the existing approved SPEC-008 and SPEC-010
  platform-verification contract; it does not amend that contract.

## Deterministic Behavior Delivered

The workflow captures `docker buildx inspect` output once and searches the
captured text independently for `linux/arm64` and `linux/arm/v6`. A present
platform passes its check. An absent platform still emits its specific error and
stops publication before registry login or image building.

## Assumptions And Impact

- The human-readable Buildx inspection output continues to list supported
  platform identifiers.
- Capturing the small inspection result in a shell variable is safe on the
  hosted runner.
- The correction allows publication to proceed past the observed false
  negative; later registry and build stages retain their existing failure
  behavior.

## Validation Performed

- Parsed the workflow as YAML.
- Checked formatting for the workflow, `AGENTS.md`, and completed-work artifacts.
- Ran a focused Bash reproduction showing both captured-output checks succeed
  with representative Buildx platform output and fail for a missing platform.
- Ran `git diff --check`.

## Validation Skipped

- Hosted GitHub Actions rerun and Forgejo publication were not performed.
- Full builds and test suites exceed the `$super-agent` short-validation limit.
- Automated tests are prohibited for workflow configuration by project policy.
- QA and independent code review are skipped by `$super-agent`.

## Documentation Changes

- Added this approved completed-work spec to the active-spec index.
- README was unchanged because publication inputs and operator behavior did not
  change.
