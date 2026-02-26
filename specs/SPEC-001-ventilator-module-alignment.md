# SPEC-001 - Ventilator Module Alignment

## Status
Approved

## Date
2026-02-26

## Purpose
Provide deterministic, testable HTTP APIs in a modular TypeScript/Node.js architecture for Raspberry Pi-controlled hardware, starting with a ventilator package that triggers Python IR commands through terminal execution.

## Scope
- In scope:
  - Keep package separation under `src/common` and `src/ventilator`.
  - Align implementation with project rules: DDD style, onion-like layering, interface-driven services/repositories, one class per file, deterministic business logic, test coverage for business logic.
  - Move all exposed routes to versioned `/api/v1/...` paths.
  - Keep `.http` coverage for controllers.
- Out of scope:
  - Additional device packages (future work).
  - External infra deployment changes.

## Definitions
- Ventilator State:
  - `isOn: boolean`
  - `speed: number` (runtime domain: 0..3)
  - `isRotating: boolean`
- Terminal Gateway: infrastructure abstraction that executes OS commands in a configured working directory.
- Ventilator Command Set:
  - Start command
  - Stop command
  - Rotate command
  - Speed step command (one command invocation increases speed by one step in a circular 1..3 range when device is ON)

## Behavioral Requirements
1. `GET /api/v1/health`
- Returns `200` with app status payload when dependencies are UP.
- Returns `503` when any dependency is DOWN.

2. `GET /api/v1/ventilator/state`
- Returns `200` with in-memory ventilator state.

3. `POST /api/v1/ventilator/start`
- If state is OFF and terminal start command succeeds: set state to `isOn=true`, `speed=1`, `isRotating=false`, return `202`.
- If state is already ON: idempotent success, return `202`.
- If command fails: return `500` error payload.

4. `POST /api/v1/ventilator/stop`
- If state is ON and terminal stop command succeeds: set state to `isOn=false`, `speed=0`, `isRotating=false`, return `202`.
- If state is already OFF: idempotent success, return `202`.
- If command fails: return `500` error payload.

5. `POST /api/v1/ventilator/rotate`
- Executes rotate command.
- If command succeeds and state is ON: `isRotating=true`, return `202`.
- If command succeeds and state is OFF: `isRotating=false`, return `202`.
- If command fails: return `500` error payload.

6. `PUT /api/v1/ventilator/speed/:speed`
- Valid input: integer `0..3`; invalid input returns `400`.
- `speed=0` delegates to stop behavior.
- `speed>0` while OFF auto-starts the ventilator and then applies speed transition.
- `speed>0` while ON executes speed-step command the minimal circular number of steps to reach desired speed and updates in-memory state deterministically.
- Success returns `202`.

## Invariants
- `speed=0` implies `isOn=false`.
- `isOn=false` implies `isRotating=false` after stop completes.
- State transitions occur only through service/domain logic, never directly in controller.
- Terminal implementations never mutate domain state directly.

## Constraints
- Node.js + TypeScript codebase.
- Keep package boundaries (`common`, `ventilator`) and design for future device packages.
- Interface-first dependencies:
  - Interfaces suffix `Interface`.
  - Implementations use same name without suffix.
- One class per file.
- Package names plural.
- Logging format is JSON.
- Terminal timeout is 5 seconds per command execution.

## Architecture Alignment Requirements
- Domain/Application split inside each package:
  - `services` (application use cases)
  - `entities` and/or `dtos` (per project rule: entities persisted, dtos non-persisted)
  - `infrastructures` (terminal execution)
  - `controllers` + `controllers/requests` + `controllers/responses`
- Controllers depend on service interfaces, not concrete implementations.
- Services depend on gateway interfaces, not concrete terminal classes.
- Composition root wires concrete implementations.

## Test Requirements
- Unit tests for ventilator business logic:
  - start/stop idempotency
  - speed transition calculations (including circular transitions)
  - auto-start behavior when setting speed while OFF
  - rotate behavior by ON/OFF states
  - failure propagation on terminal errors
- Unit tests for configuration validation.

## Documentation Requirements
- Keep `README.md` and `AGENTS.md` aligned with enforced implementation standards.
- Keep `.http` files for each controller under `/http`.
- OpenAPI file must describe versioned endpoints.
- Event documentation required only if events are introduced.

## Assumptions
- Ventilator state is in-memory and resets on process restart.
- Command execution success is represented by exit code `0`.
- API process has OS permissions to execute configured commands.

## Acceptance Criteria
- Dedicated branch exists for this spec.
- Spec file approved.
- Code refactor aligns with interface-driven architecture and package boundaries.
- Old unversioned routes are removed.
- Build succeeds and tests pass.
