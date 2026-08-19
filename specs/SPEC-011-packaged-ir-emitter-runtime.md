# SPEC-011 - Packaged IR Emitter Runtime

## Status

Approved

## Date

2026-08-19

## Purpose

Allow the published Device Integration API image to execute fan IR commands
through the Forgejo-published emitter package without mounting an emitter source
checkout.

## Requested Behavior

- Install pinned `rpi-groove-ir-emitter` version `1.0.1` in the runtime image.
- Retain the explicit `pigpio` runtime installation.
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

- Use the public Forgejo simple index without credentials.
- Pin the emitter package exactly to `1.0.1` for reproducible image builds.
- Install the package with `--no-deps` because `pigpio` is already installed and
  the published distribution may carry build-host-selected board dependencies
  that are not required by the container runtime.
- Preserve ARM64 and ARMv6 image publication behavior.

## Deterministic Behavior Delivered

The runtime image build installs `pigpio`, then installs exactly
`rpi-groove-ir-emitter==1.0.1` from Forgejo. The installed module is available
to the existing terminal gateway as `python3 -m ir_emitter` without a mounted
emitter source tree or repository launcher.

## Assumptions And Impact

- Emitter `1.0.1` remains available from the public Forgejo index.
- The package runtime continues to require only pigpio for the executed path.
- A new Device Integration API image tag must be published before deployments
  can consume this change.

## Validation Performed

- Inspected the rendered Dockerfile structure and package-install command.
- Ran `git diff --check`.

## Validation Skipped

- Docker build, Forgejo download, ARM64/ARMv6 image publication, and runtime IR
  playback exceed the `$super-agent` short-validation boundary.
- Automated tests are prohibited for Docker-only behavior by project policy.
- QA and independent code review are skipped by `$super-agent`.

## Documentation Changes

- README documents packaged emitter execution and external pulse-data ownership.
- AGENTS indexes this approved completed-work spec.
