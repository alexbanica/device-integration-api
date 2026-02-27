# SPEC-003 - Node pigpio-client IR Emitter Package

## Status
Approved

## Date
2026-02-27

## Purpose
Introduce a Node.js-native IR emission capability based on `pigpio-client`, replacing shell/Python command execution for IR transmission paths, while preserving deterministic ventilator behavior and enforcing deeper package separation outside `common` and `ventilator`.

## Scope
- In scope:
  - Add a new dedicated package under `src` for pigpio-based IR transport (`hardwares`).
  - Implement infrastructure adapters in that package using `pigpio-client` for waveform transmission.
  - Keep ventilator application/service logic in `src/ventilator` and consume IR transport through interfaces.
  - Define startup/configuration validation for pigpio host/port and GPIO/carrier defaults needed by IR emission.
  - Keep existing HTTP contract for ventilator endpoints unchanged.
  - Add unit tests for new business/infrastructure orchestration logic and deterministic failure behavior.
- Out of scope:
  - New REST endpoints.
  - Event publishing/consumption.
  - Rewriting existing Python emitter repository.

## Definitions
- IR Frame: ordered pulse durations in microseconds alternating mark/space.
- Pigpio Endpoint: TCP endpoint exposed by `pigpiod` (default: `localhost:8888`).
- Infrared Transport Interface: abstraction that can transmit an IR frame with deterministic success/failure signaling.
- Ventilator IR Command Mapping: mapping from ventilator operations (`start`, `stop`, `rotate`, `speed`) to IR frame definitions.

## Behavioral Requirements
1. Package placement and boundaries
- `pigpio-client` integration MUST live in a dedicated package outside `common` and `ventilator`.
- `ventilator` package MUST depend on interface contracts, not concrete `pigpio-client` classes.

2. IR transmission contract
- Infrared transport adapter MUST expose a deterministic async result for transmit operations (success or explicit failure).
- Failures from pigpio connectivity or waveform submission MUST propagate to ventilator service as operation failures.

3. Ventilator command execution path
- Ventilator operations (`start`, `stop`, `rotate`, `increaseSpeed`) MUST use the new IR transport path instead of terminal shell commands.
- Existing ventilator state machine behavior from SPEC-001 MUST remain unchanged.

4. Configuration
- Missing required pigpio/IR configuration MUST fail fast during module wiring with explicit configuration errors.
- Configuration values MUST be read from environment and validated before first command execution.

5. Runtime assumptions enforcement
- On startup or first use, adapter MUST validate pigpio connectivity with deterministic failure handling.
- No automatic background daemon startup is allowed in API runtime.

## Invariants
- HTTP route contracts and response codes defined by SPEC-001 remain unchanged.
- Domain state mutations remain inside ventilator service logic only.
- IR transport package remains infrastructure-oriented and does not own ventilator domain state.
- No shell-based IR command execution remains in active ventilator flow after implementation.

## Constraints
- Keep DDD/onion dependency direction:
  - Controllers -> Service Interfaces -> Domain/DTOs
  - Infrastructure implements interfaces and is wired in composition root.
- One class per file.
- Package names must be plural.
- Interface names must end with `Interface`.
- Service implementation names must match interface name without `Interface`.
- Node.js + TypeScript only for this integration path.

## Architecture Alignment Requirements
  - Add new package: `src/hardwares`
  - Add new package: `src/hardwares`
  - `configurations` for pigpio/IR configuration objects and validation errors.
  - `dtos` for IR frame payloads and command mappings.
  - `infrastructures` for `pigpio-client` adapter and related interfaces.
- Replace ventilator terminal gateway dependency with IR transport gateway interface backed by `hardwares` infrastructure.
- Composition root (`ventilator` module registration) wires ventilator service with the new IR gateway implementation.

## Test Requirements
- Unit tests for configuration validation (required fields, invalid numeric ranges).
- Unit tests for ventilator-to-IR command mapping behavior.
- Unit tests for failure propagation when pigpio transport fails.
- Unit tests for successful transmission path preserving SPEC-001 state transitions.

## Documentation Requirements
- Update `AGENTS.md` active specs list.
- Update `README.md` architecture section to include new package role.
- Update `.env` documentation for new pigpio/IR configuration keys.
- `.http` files unchanged unless API contract changes (not expected in this spec).
- Swagger/OpenAPI unchanged unless API contract changes (not expected in this spec).
- Event documentation not required (no events introduced).

## Assumptions
- Host `pigpiod` remains externally managed and reachable from API runtime.
- IR frames for ventilator commands are available to the API (embedded config or referenced static files).
- `pigpio-client` package version selected is compatible with project Node.js runtime.

## Resolved Decisions
1. Source of IR frames
- Frames are loaded from JSON files at runtime.
2. Package naming
- New deeper package is `src/hardwares`.
3. Pigpio connection lifecycle
- Keep a shared process-level pigpio client in the emitter infrastructure.
4. Command mapping ownership
- Ventilator-specific command file mapping remains in `ventilator/configurations`.

## Acceptance Criteria
- Dedicated branch exists for this spec.
- Spec file is approved.
- Implementation branch (follow-up) removes ventilator shell command dependency in active path.
- New pigpio-client IR transport package exists outside `common` and `ventilator`.
- Build succeeds and tests pass after implementation.
