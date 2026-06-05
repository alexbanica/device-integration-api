# SPEC-006 - Fan State Persistence

## Status
Approved

## Date
2026-06-05

## Purpose
Persist fan service state across process and container restarts by storing the
state in a file that can live on a Docker volume.

## Problem Statement
The fan service currently initializes a new default `FanStateDto` on every
process start. If the service restarts after successfully changing fan state,
`GET /api/v1/fan/state` reports the default OFF state instead of the last known
application state.

The service needs durable application state storage so deployments can mount a
volume and preserve fan state across restarts.

## Scope
- In scope:
  - Persist the existing fan state fields: `isOn`, `speed`, and `isRotating`.
  - Load persisted state during fan module startup.
  - Create the configured state file during startup when it does not exist.
  - Save state after each successful fan service state transition.
  - Expose the persistence location through a Docker volume directory.
  - Add configuration for the fan state file path.
  - Preserve existing fan HTTP routes, status codes, and response body shape.
  - Add deterministic unit tests for state loading, validation, and saving.
  - Update README Docker run guidance for mounting the state volume.
- Out of scope:
  - Detecting or reconciling physical fan state on startup.
  - Persisting terminal gateway timestamps or standby timeout history.
  - Persisting command history, telemetry, events, or audit records.
  - Adding a database or external storage service.
  - Adding new fan API endpoints or changing OpenAPI contracts.
  - Changing start, stop, rotate, speed, or standby wakeup command semantics.

## Definitions
- Fan application state: the service-owned state represented by `isOn`, `speed`,
  and `isRotating`.
- State store: the fan bounded-context persistence port responsible for loading
  and saving `FanStateDto`.
- State file: the JSON file used by the filesystem state store.
- Volume directory: the container directory that can be mounted as a Docker
  volume and contains the state file.
- Persisted state: the last valid fan application state successfully written to
  the state file.

## Inputs And Constraints
- The state file path is configured by `FAN_STATE_FILE_PATH`.
- If `FAN_STATE_FILE_PATH` is missing, the default path is
  `./state/fan-state.json` relative to the process working directory.
- The Docker runtime image declares `/app/state` as the volume directory.
- The Docker runtime default working directory remains `/app`, so the default
  state file path resolves to `/app/state/fan-state.json` in the container.
- The state file format is JSON with exactly these persisted behavior fields:
  - `isOn: boolean`
  - `speed: integer`
  - `isRotating: boolean`
- Valid state invariants are:
  - `speed` is an integer from `0` through `3`;
  - `speed=0` requires `isOn=false`;
  - `isOn=false` requires `speed=0`;
  - `isOn=false` requires `isRotating=false`.
- The service remains the authority for application state. Infrastructure may
  load and save state but must not decide fan command behavior.
- The implementation must preserve the repository's layering:
  - service logic owns state transitions;
  - a fan service-layer storage interface defines persistence operations;
  - filesystem persistence is implemented in fan infrastructure;
  - the composition root wires the filesystem store into `FanService`.

## Deterministic Behavior
1. Startup load
- During fan module startup, before registering controller behavior, the service
  loads state from the configured state store.
- If the state file does not exist, the state store creates the parent directory
  when needed, writes a new state file with the existing default state, and the
  service starts with that state: `isOn=false`, `speed=0`, `isRotating=false`.
- If the state file exists and contains valid persisted state, that state becomes
  the initial `FanService` state.
- If the state file exists but cannot be read, parsed as JSON, or validated
  against the state invariants, startup fails with a clear fan state persistence
  error.

2. Save after successful state transitions
- After `start` successfully changes state to ON, the new state is saved.
- After `stop` successfully changes state to OFF, the new state is saved.
- After `rotate` successfully updates `isRotating`, the new state is saved.
- After `setSpeed` successfully changes speed, the new state is saved.
- Idempotent operations that do not change state do not write the state file.
- Validation failures and failed terminal commands do not write the state file.

3. Atomicity and directory handling
- The filesystem state store creates the parent directory for the configured
  state file path when it does not exist.
- The filesystem state store creates the state file with default OFF state when
  it does not exist during startup load, before the HTTP controller is registered.
- State writes are atomic from the reader perspective: write to a temporary file
  in the same directory and then rename it over the configured state file.
- The persisted JSON is stable and contains only `isOn`, `speed`, and
  `isRotating`.

4. HTTP state exposure
- `GET /api/v1/fan/state` returns the loaded or most recently saved application
  state using the existing response payload fields.
- No new API endpoint is added for persistence.

5. Docker volume exposure
- The Docker runtime image exposes `/app/state` as a mountable volume directory.
- Documentation shows a Docker run example that mounts a volume at `/app/state`.
- With the default `FAN_STATE_FILE_PATH`, the state file survives container
  replacement when `/app/state` is mounted.

## Assumptions
- Persisted application state is the required source of truth after restart; the
  physical fan is not queried or reconciled.
- Preserving standby gateway timestamp history is not required. After restart,
  existing first-command standby behavior still applies.
- Failing startup on malformed persisted state is safer than silently replacing it
  with the default OFF state.
- The current single-process service model is retained; concurrent writers to the
  same state file are unsupported.

## Impact And Regression Considerations
- `SPEC-001` and `SPEC-005` behavior that says state is in-memory is superseded
  only for fan application state durability.
- Service construction changes from synchronous default state initialization to a
  startup path that can load persisted state and fail before routes are usable.
- Unit tests must cover persistence without relying on Docker.
- Docker image changes must not require Docker validation unless implementation
  QA explicitly runs Docker with the local context selected.
- No OpenAPI update is expected because HTTP contracts do not change.

## Validation Plan
- Unit tests:
  - missing state file creates parent directory, writes default OFF state, and
    initializes `FanService`;
  - valid persisted state initializes `FanService`;
  - malformed JSON causes startup/load failure;
  - invalid state invariants cause startup/load failure;
  - successful `start`, `stop`, `rotate`, and `setSpeed` save state;
  - idempotent no-op operations do not save state;
  - failed terminal commands do not save state;
  - filesystem store creates the parent directory and writes stable JSON.
- Run:
  - `npm test`
  - `npm run build`
  - `git diff --check`
- Manual Docker QA when Docker validation is available:
  - select and verify Docker context `local`;
  - build the image;
  - run the container with a volume mounted at `/app/state`;
  - change fan state through the API;
  - restart or replace the container with the same volume;
  - confirm `GET /api/v1/fan/state` returns the persisted state.

## Documentation Requirements
- Add this spec file under `specs/`.
- Update `AGENTS.md` active specs after approval.
- Update `README.md` required or optional environment variable documentation for
  `FAN_STATE_FILE_PATH`.
- Update `README.md` Docker run guidance to mount `/app/state`.
- Do not update `.http` files or OpenAPI unless implementation changes the API
  contract, which this spec does not require.

## Acceptance Criteria
- Spec is approved before implementation.
- Implementation plan is approved before implementation.
- Implementation occurs on a dedicated branch, not `main` or `master`.
- Fan state survives process/container restart when the same state file or mounted
  `/app/state` volume is reused.
- Invalid persisted state fails startup instead of silently resetting state.
- Existing fan API payloads and status codes remain unchanged.
- Business logic and persistence behavior are covered by deterministic tests.
- Build and tests pass before final delivery, or delivery is explicitly marked
  draft.
