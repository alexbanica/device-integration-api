# PLAN-012 - Buildx Platform Verification Reliability

Status: Approved

Spec: `specs/SPEC-012-buildx-platform-verification-reliability.md`

## Affected Files

- `.github/workflows/publish-docker-images.yml`
- `AGENTS.md`
- `specs/SPEC-012-buildx-platform-verification-reliability.md`
- `specs/PLAN-012-buildx-platform-verification-reliability.md`

## Implementation Steps Performed

1. Confirmed the failed hosted job advertised both required platforms before
   the verification step reported `linux/arm64` unavailable.
2. Identified the `set -o pipefail` and producer-to-`grep -q` interaction as the
   false-negative path.
3. Changed the workflow to capture one Buildx inspection result and check both
   required platforms from that captured output.
4. Preserved the existing missing-platform errors and all publication inputs.
5. Added and indexed the completed-work artifacts.
6. Ran short static and focused shell validation and reconciled the staged set.

## Validation Run

- YAML parsing of `.github/workflows/publish-docker-images.yml`.
- Prettier check of all four affected files.
- Focused Bash success and missing-platform checks using representative Buildx
  output.
- `git diff --check`.

## Validation Skipped

- Hosted GitHub Actions rerun and live Forgejo publication.
- Full Docker build and multi-platform runtime checks.
- Automated workflow tests because project policy prohibits them.
- Full repository build and test suite because they exceed the `$super-agent`
  short-validation limit and the production change is workflow-only.

## QA And Code Review

- QA skipped by `$super-agent`.
- Independent code review skipped by `$super-agent`.

## Documentation Updates

- Added SPEC-012 to `AGENTS.md`.
- README unchanged because the published contract did not change.

## Staging, Commit, And Push Status

- The complete accepted change set is staged in the invoking checkout.
- No commit or push was requested or performed.
- No linked worktree was used.

## Residual Risk

- The corrected path remains unverified on a hosted runner until a commit is
  published and a new tag runs the workflow.
- A rerun of the existing `1.2.4` job would continue using the workflow at its
  original tagged commit.
