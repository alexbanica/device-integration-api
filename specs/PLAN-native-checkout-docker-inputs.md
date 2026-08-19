# Plan: Native Checkout Docker Inputs

Status: Approved

## Spec Reference

- `specs/SPEC-native-checkout-docker-inputs.md`

## Affected Files

- `.github/workflows/publish-docker-images.yml`, `.dockerignore`, and `README.md`
- `docker/Dockerfile`, `docker/build.sh`, `docker/.env`, and removed
  `docker/.dockerignore`
- `tests/docker/BuildScript.test.ts` and `tests/docker/Dockerfile.test.ts`
- This spec and plan

## Implementation Performed

1. Replaced GitHub archive acquisition with root-context copies.
2. Removed GitHub revision, token, secret, and downloader plumbing.
3. Moved Docker ignore protection to the repository root.
4. Pruned unused `.env` entries and aligned focused contract tests and README.

## Validation

- Ran wrapper syntax, focused compiled Docker tests, workflow YAML parsing, and
  `git diff --check`.
- Skipped full tests, live builds/publishing, QA, and independent review under
  `super-agent`.

## Documentation And Delivery

- Updated README and added retrospective approved artifacts.
- The accepted paths are committed and pushed to
  `origin/chore/native-checkout-docker-builds` as explicitly requested.
- No linked worktree or invoking-checkout artifact cleanup applies.

## Residual Risk

Only live multi-platform Docker builds and hosted publication can prove complete
ARM64/ARMv6 image assembly and Forgejo manifest publication.
