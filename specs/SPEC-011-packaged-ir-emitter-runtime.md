# SPEC-011 - Packaged IR Emitter Runtime

## Status

Approved

## Date

2026-08-19

## Iteration: Resolve dependencies from public PyPI

The initial implementation selected Forgejo as pip's primary index but also
used `--no-deps`. This iteration requires the image build to follow the emitter
package's published installation contract: select the emitter from Forgejo and
allow its declared dependencies to resolve from public PyPI.

## Purpose

Allow the published Device Integration API image to execute fan IR commands
through the Forgejo-published emitter package without mounting an emitter source
checkout.

## Requested Behavior

- Install pinned `rpi-groove-ir-emitter` version `1.0.1` in the runtime image.
- Retain the explicit `pigpio` runtime installation.
- Use the public Forgejo simple index as pip's primary package index.
- Use `https://pypi.org/simple` as pip's additional dependency index.
- Resolve the emitter distribution's declared dependencies; do not suppress
  dependency resolution with `--no-deps`.
- Make `python3 -m ir_emitter <pulse-file>` available to fan command
  configuration.
- Keep pulse JSON files outside the image as deployment configuration.

## Scope

- `docker/Dockerfile`
- Runtime-image documentation in `README.md`
- Active-spec index in `AGENTS.md`
- This completed-work spec and plan

## Out of Scope

- API, fan-domain, controller, or shell-execution behavior changes.
- Embedding device pulse captures in the image.
- Creating a Git tag or publishing a new image.
- Updating a deployed Compose stack.

## Inputs And Constraints

- Use the public Forgejo simple index without credentials as the primary index.
- Use public PyPI as the additional index for dependencies that are not
  published in Forgejo.
- Pin the emitter package exactly to `1.0.1` for reproducible image builds.
- Preserve the explicit `pigpio` install while allowing pip to validate and
  resolve all declared package dependencies.
- Preserve ARM64 and ARMv6 image publication behavior.

## Deterministic Behavior Delivered

The runtime image build installs `pigpio`, then installs exactly
`rpi-groove-ir-emitter==1.0.1` with Forgejo as `--index-url` and public PyPI as
`--extra-index-url`. Pip dependency resolution remains enabled. The installed
module is available to the existing terminal gateway as
`python3 -m ir_emitter` without a mounted emitter source tree or repository
launcher.

## Assumptions And Impact

- Emitter `1.0.1` remains available from the public Forgejo index.
- Every dependency declared by the published emitter distribution remains
  available from Forgejo or public PyPI and compatible with both target image
  platforms.
- A new Device Integration API image tag must be published before deployments
  can consume this change.

## Regression Impact

- The package source remains Forgejo; PyPI is used only as an additional
  candidate index, primarily for third-party dependencies.
- Removing `--no-deps` may expose platform-specific dependency incompatibility
  during ARM64 or ARMv6 builds. The image build must fail rather than publish an
  installation missing declared dependencies.
- Fan API behavior, commands, pulse files, and pigpio connectivity do not change.

## Validation Performed

- Verified the Dockerfile command contains the exact primary and additional
  index URLs and does not contain `--no-deps`.
- Ran `git diff --check`.

## Validation Skipped

- Docker builds, Forgejo/PyPI downloads, ARM64/ARMv6 image publication, and
  runtime import/playback checks exceed the `$super-agent` short-validation
  boundary.
- Automated tests are prohibited for Docker-only behavior by project policy.
- QA and independent code review are skipped by `$super-agent`.

## Documentation Changes

- README documents dependency-resolving installation through Forgejo plus
  public PyPI and external pulse-data ownership.
- AGENTS indexes this approved completed-work spec.
