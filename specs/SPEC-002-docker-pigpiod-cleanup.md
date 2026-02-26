# SPEC-002 - Docker Pigpiod Cleanup

## Status
Approved

## Date
2026-02-26

## Purpose
Simplify container runtime by removing in-container pigpio daemon build/install/startup because `pigpiod` is already running on the bare-metal host and the container runs with host networking to use host `localhost:8888`.

## Scope
- In scope:
  - Remove pigpio daemon compilation and binary copy from Docker image build.
  - Remove runtime startup logic for local `pigpiod` from container entrypoint.
  - Remove Python + pigpio package install from runtime image.
  - Keep Node API process startup intact.
  - Keep container running on host network mode (operational assumption).
- Out of scope:
  - Changes to ventilator API behavior.
  - Host-level pigpiod setup and lifecycle.

## Definitions
- Host pigpiod: `pigpiod` service running directly on host OS (outside container).
- Host network mode: container networking that shares host network namespace.
- Target pigpio endpoint: `localhost:8888` resolved from inside container when host networking is enabled.

## Behavioral Requirements
1. Image build
- Docker build MUST NOT compile pigpio from source.
- Docker build MUST NOT copy `pigpiod` binary/libraries into runtime image.
- Docker build MUST NOT install Python or pigpio runtime dependencies.

2. Container startup
- Entrypoint MUST NOT attempt to start `pigpiod` in-container.
- Entrypoint MUST remain a minimal passthrough wrapper that executes the container command.

3. Runtime connectivity contract
- App runtime expects pigpio endpoint to be reachable at `localhost:8888` through host networking.
- If host pigpiod is unavailable, app behavior follows existing runtime error handling (no new retry policy introduced in this spec).

## Invariants
- Container remains single responsibility: API runtime only.
- No local daemon process manager behavior in container.
- Existing exposed app port (`3000`) remains unchanged.

## Constraints
- Keep current base image strategy unless directly required by this cleanup.
- Avoid introducing backward-compatibility shims for in-container pigpiod.
- Keep build deterministic and lean; remove dead stages/files.

## Assumptions
- Deployment always uses host network mode for this service.
- Host machine always runs pigpiod service bound to TCP `8888`.

## Acceptance Criteria
- New spec branch created from `main`.
- Spec file approved.
- Dockerfile no longer contains pigpio builder stage/copy logic.
- Dockerfile no longer installs Python/pigpio runtime dependencies.
- Entrypoint no longer starts pigpiod.
- Documentation updated to reflect host-network pigpiod dependency.
