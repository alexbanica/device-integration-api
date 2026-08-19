# Spec: Native Checkout Docker Inputs

Status: Approved

## Purpose

Build release images directly from the repository checkout already supplied by
GitHub Actions instead of downloading the same source through the GitHub API.

## Requested Behavior

- The checked-out repository root is the Docker build context.
- GitHub source archive, revision, token-file, and BuildKit secret plumbing is
  removed from the Dockerfile, wrapper, and publication workflow.
- Tracked Docker environment configuration contains only active local defaults.

## Scope

- Publication workflow, Dockerfile, wrapper, `.env`, and `.dockerignore`.
- Focused Docker contract tests and README Docker guidance.

## Out Of Scope

- Image tags, platforms, Forgejo credentials, application runtime behavior,
  Docker execution, and live publication.

## Definitions And Constraints

`Native checkout` means the tag event files populated by `actions/checkout` are
the sole project source used by the Docker build. The root context must exclude
repository metadata, generated output, environment files, and credential-like
files.

## Deterministic Behavior Delivered

1. The Dockerfile has builder and runtime stages only and copies checked-out
   files from the root build context.
2. The wrapper no longer accepts source-revision or secret-file options and no
   longer passes GitHub build arguments or secrets.
3. The workflow no longer writes, passes, or deletes a GitHub token file.
4. Root `.dockerignore` rules protect the expanded build context.
5. `docker/.env` retains only base image versions and the local registry.

## Assumptions And Impact

`actions/checkout` provides the tag event source before the wrapper runs. The
image's dependency installation, build, runtime files, tags, and platforms stay
unchanged.

## Validation Performed

- Wrapper syntax check.
- Focused compiled Docker wrapper and Dockerfile contract tests: 2 passed.
- Publication workflow YAML parse and `git diff --check`.

## Validation Skipped

- Full project tests, Docker builds, hosted GitHub Actions, Forgejo login/push,
  QA, and independent code review.

## Documentation Changes

README Docker guidance now describes checkout-backed source and removes obsolete
GitHub archive/token behavior.
