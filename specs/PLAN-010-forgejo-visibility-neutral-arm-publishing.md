# PLAN-010 - Forgejo Visibility-Neutral ARM Publishing

## Status

Approved

## Date

2026-08-17

## Spec Reference

- `specs/SPEC-010-forgejo-visibility-neutral-arm-publishing.md`
- Status: `Approved`

## Delivery Context

- Direct execution command: `super-agent`
- Invoking checkout: `/home/alexbanica/workspace/device-integration-api`
- Delivery branch: `feature/spec-008-arm-publishing-visibility-compatible`
- Base: pushed SPEC-008 commit `6ee8b52ef966881e503f0436830a3babbb4859e8`
- Linked worktree: not requested and not used.

## Affected Files

- `.github/workflows/publish-arm.yml`
- `README.md`
- `AGENTS.md`
- `specs/SPEC-010-forgejo-visibility-neutral-arm-publishing.md`
- `specs/PLAN-010-forgejo-visibility-neutral-arm-publishing.md`

## Implementation Performed

1. Preserved the existing single Buildx publication with the exact ordered
   platform value `linux/arm64,linux/arm/v6`.
2. Removed the authenticated Forgejo organization API query and hard-coded
   `visibility: private` publication gate.
3. Removed the `read:organization` and private-read requirements from operator
   documentation while retaining package-write authentication.
4. Documented that public/private visibility changes do not block publication
   when the credentials remain authorized to write the package.
5. Added SPEC-010 as the narrow approved override for SPEC-008 privacy
   requirements and updated the active-spec index.

## Validation Run

- `bash -n docker/build.sh` passed.
- `npm run lint` passed.
- `npm test` passed all 66 tests.
- `npx prettier --check .github/workflows/publish-arm.yml README.md AGENTS.md`
  passed.
- `git diff --check` passed.
- Static workflow inspection confirmed both required target platforms, QEMU and
  Buildx setup, secure Forgejo login, one push-enabled build-script invocation,
  and absence of the removed visibility API check.
- Docker Hub tag metadata for `node:19.2.0-alpine3.15` and `alpine:3.15`
  confirmed active ARM64 and ARMv6 variants on 2026-08-17.

## Validation Skipped

- `actionlint` was not installed.
- No live GitHub Actions tag run, Docker/QEMU build, Forgejo publication,
  resulting manifest inspection, image pull, or runtime smoke test was run.

## Review And QA

- Independent code review: skipped as required by `super-agent`.
- QA phase: skipped as required by `super-agent`.

## Documentation Updates

- README publication prerequisites and validation boundaries now match
  visibility-neutral Forgejo publishing.
- AGENTS records SPEC-010 and the historical SPEC-008 dependency.
- No OpenAPI or `.http` update was needed because no API contract changed.

## Staging And Delivery Status

- Every accepted in-scope path is staged for Git tracking.
- Commit: not created; not authorized by this `super-agent` invocation.
- Push: not performed; not authorized by this `super-agent` invocation.
- Worktree attachment/cleanup: not applicable because no linked worktree was
  used.

## Residual Risk And Delivery Classification

- The configured workflow and pinned base-image metadata support ARM64 and ARMv6,
  but the image has not been built or run for either architecture in this
  invocation.
- Hosted runner, QEMU emulation, Forgejo authentication, registry push, and
  exact output manifest remain unverified live.
- Delivery is DRAFT because review, QA, hosted publication, and architecture
  runtime validation were skipped.
- The default Definition of Done is not fully satisfied under `super-agent`.
