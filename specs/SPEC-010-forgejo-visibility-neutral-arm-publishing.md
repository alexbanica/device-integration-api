# SPEC-010 - Forgejo Visibility-Neutral ARM Publishing

## Status

Approved

## Date

2026-08-17

## Purpose

Keep the SPEC-008 container publication compatible with both ARM64 and ARMv6
while allowing the Forgejo owner or package visibility to change without
blocking an otherwise authorized publish.

## Requested Behavior

- Publish each release and rolling tag as one multi-platform manifest containing
  exactly `linux/arm64` and `linux/arm/v6`.
- Do not query Forgejo organization metadata or require a private visibility
  result before publication.
- Do not require a private-read or anonymous-read-denial check.
- Require only the Forgejo authentication and package-write access needed to
  push the image.

## Relationship To SPEC-008

This spec supersedes only SPEC-008 requirements that:

- describe the Forgejo owner or published package as required to be private;
- require `read:organization` solely for a visibility preflight;
- query `/api/v1/orgs/alexlab` before registry login or upload; or
- require private/anonymous-read validation before delivery.

All other approved SPEC-008 behavior remains unchanged, including the all-tag
trigger, immutable event source revision, exact Forgejo registry prefix, secure
registry login, exact image tags, one Buildx invocation, and exact ordered
platform value `linux/arm64,linux/arm/v6`.

## Scope

In scope:

- `.github/workflows/publish-docker-images.yml` visibility-independent publication.
- README publication prerequisites and validation boundaries.
- Active-spec documentation and completed-work artifacts.

Out of scope:

- Changing the Forgejo owner, package, or repository visibility.
- Publishing to another registry or namespace.
- Adding another CPU architecture or architecture-specific tags.
- Changing application, API, fan, Docker runtime, or local build behavior.
- Creating a tag, pushing an image, or changing Forgejo/GitHub configuration.

## Definitions

- Visibility-neutral publication: registry upload behavior whose preconditions do
  not depend on whether the Forgejo owner or package is public, limited, or
  private.
- Required platform set: exactly `linux/arm64,linux/arm/v6`, published as one
  manifest index for each existing release and rolling tag.
- Private-read check: any owner/package visibility query or anonymous-pull
  denial check used as a publication gate.

## Inputs And Constraints

- Registry output remains `forgejo.alexlab.nl/alexlab`.
- `FORGEJO_REGISTRY_USERNAME` and `FORGEJO_REGISTRY_TOKEN` remain required.
- The token account must be authorized to write packages owned by `alexlab`; a
  `read:organization` grant is not required by this workflow.
- The workflow must still fail before build/push when secrets, Docker tag
  grammar, registry prefix, or either requested Buildx platform is invalid or
  unavailable.
- Changing Forgejo visibility must not require a workflow or token-scope change
  when package-write authorization remains valid.

## Deterministic Behavior Delivered

1. Every pushed Git tag starts the existing ARM publication workflow.
2. The workflow validates the two registry secrets, tag grammar, exact registry
   prefix, and Buildx support for both required platforms.
3. The workflow does not call the Forgejo organization API or inspect owner or
   package visibility.
4. The workflow logs into `forgejo.alexlab.nl` and invokes `docker/build.sh`
   once with `--platform linux/arm64,linux/arm/v6` and `--push`.
5. Both existing image tags are therefore requested as multi-platform manifest
   indexes independent of Forgejo visibility.
6. The delivery branch incorporates the freshly fetched `origin/main`, retaining
   its GitHub Actions unit-test policy and SPEC-009 index entry alongside the
   historical SPEC-008 and active SPEC-010 entries.

## Assumptions

- Forgejo continues to accept the configured credentials for package writes.
- The pinned `node:19.2.0-alpine3.15` and `alpine:3.15` tags remain available for
  both target architectures. Docker Hub metadata checked on 2026-08-17 listed
  active `linux/arm/v6` and ARM64 variants for both tags.
- Actual runtime compatibility still requires successful builds and smoke tests
  on ARM64 and ARMv6 hardware.

## Impact

- Publication no longer fails merely because `alexlab` or its package changes
  visibility.
- `FORGEJO_REGISTRY_TOKEN` no longer needs organization-read access solely for
  the removed preflight.
- Registry destination, credentials, image names, source revision, caching,
  secret handling, and platform output do not change.
- No application, OpenAPI, or `.http` contract changes.

## Validation Performed

- `bash -n docker/build.sh`
- `npm run lint`
- `npm test` (66 passing tests)
- `npx prettier --check .github/workflows/publish-docker-images.yml README.md AGENTS.md`
- `git diff --check`
- Static inspection confirmed one exact `linux/arm64,linux/arm/v6` Buildx input
  and no Forgejo organization/visibility/private-read step in the workflow.
- Docker Hub tag metadata confirmed ARM64 and ARMv6 variants for both pinned base
  tags on 2026-08-17.
- `git merge-tree` identified `AGENTS.md` as the only merge conflict against the
  freshly fetched `origin/main` commit `6b2b5b8b4eb7d6a106803a1482812e0fbc0161f0`.
- Conflict-marker inspection and `git diff --check` confirmed the resolved
  documentation contains no unresolved merge markers or whitespace errors.

## Validation Skipped

- `actionlint` was unavailable locally.
- No GitHub-hosted workflow execution, Docker build, Forgejo login/push, manifest
  inspection, pull, or ARM64/ARMv6 runtime smoke test was performed.
- QA and independent code review are skipped by the `super-agent` workflow.

## Documentation Changes

- README now documents `write:package` access without an organization-read or
  privacy prerequisite and explains visibility-neutral publication.
- AGENTS lists this approved correction, retains SPEC-008 as historical context,
  and incorporates the GitHub Actions testing policy and SPEC-009 entry from
  `origin/main`.
