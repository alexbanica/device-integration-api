# PLAN: GitHub Actions Docker Publish Naming Alignment

Status: Approved
Date: 2026-08-17

## Spec Reference

`specs/SPEC-github-actions-docker-publish-naming-alignment.md`

## Affected Files

- `.github/workflows/publish-docker-images.yml`
- `README.md`
- `specs/PLAN-008-github-actions-ci-private-arm64-image-publishing.md`
- `specs/PLAN-010-forgejo-visibility-neutral-arm-publishing.md`
- `specs/SPEC-010-forgejo-visibility-neutral-arm-publishing.md`
- `specs/SPEC-github-actions-docker-publish-naming-alignment.md`
- `specs/PLAN-github-actions-docker-publish-naming-alignment.md`

## Implementation Steps Performed

1. Inventoried tracked Docker build-and-publish workflows across the workspace.
2. Confirmed `main` matched a freshly fetched `origin/main`.
3. Renamed the publication workflow to `publish-docker-images.yml`.
4. Added the common workflow/run names and explicit job/step display names.
5. Updated every checked-in reference to the common workflow filename.
6. Preserved triggers, runners, actions, secrets, platforms, and commands.
7. Performed short static validation and reconciled the accepted paths.

## Validation Run

- YAML parse and cross-workflow naming/contract checks.
- `git diff --check`.

## Validation Skipped

Hosted Actions, Docker builds, registry pushes, and live manifest checks were
skipped because they exceed the short `super-agent` validation boundary.

## Test, QA, And Review Status

Test-first work is not applicable to workflow naming configuration. Unit tests
were not added or run. Independent QA and code review were skipped as required
by the requested `super-agent` workflow.

## Documentation, Staging, Commit, And Push Status

The README, existing path references, and matching completed-work artifacts were
updated. All accepted paths were staged and included in the delivery commit. The
delivery was committed on `main` and pushed to `origin/main`; exact remote
verification is recorded in the completion report.

## Residual Risk

Hosted rendering and execution remain unverified. External automation keyed to
an earlier workflow path or display name may require reconfiguration.
