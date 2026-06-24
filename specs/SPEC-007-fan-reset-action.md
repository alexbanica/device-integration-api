# SPEC-007 - Fan Reset Action

## Status
Approved

## Date
2026-06-24

## Purpose
Add a fan reset action endpoint that resets the fan application state to the
default OFF state and persists that state to the configured fan state file.

## Problem Statement
The fan service can persist application state across restarts, but there is no
HTTP action for repairing or clearing the service-owned state without issuing a
physical fan command. Operators need a deterministic reset endpoint that updates
both in-memory state and the persistent file.

## Scope
- In scope:
  - Add a `POST /api/v1/fan/reset` action endpoint.
  - Reset the service-owned fan application state to the default OFF state:
    `isOn=false`, `speed=0`, and `isRotating=false`.
  - Save the reset state through the existing fan state persistence path.
  - Ignore any request body sent to the reset endpoint.
  - Preserve existing fan start, stop, rotate, speed, state, startup load, and
    persistence validation behavior.
  - Add deterministic tests for reset service behavior and reset HTTP contract
    behavior.
  - Update `.http` and OpenAPI documentation for the new endpoint.
- Out of scope:
  - Executing physical fan shell commands during reset.
  - Querying, reconciling, or changing physical fan state.
  - Adding request payload fields, query parameters, or route parameters.
  - Changing the persisted state file format.
  - Changing existing action endpoint request-body handling.
  - Adding audit events, telemetry, or command history.

## Definitions
- Reset action: the HTTP action that clears service-owned fan application state
  to the default OFF state and persists it.
- Default OFF state: `isOn=false`, `speed=0`, and `isRotating=false`, matching
  the default `FanStateDto` state and the valid persistence invariants from
  `SPEC-006`.
- Fan application state: the service-owned state represented by `isOn`, `speed`,
  and `isRotating`.
- Persistent file: the configured fan state JSON file managed by the existing
  fan state store.

## Inputs And Constraints
- The endpoint path is `POST /api/v1/fan/reset`.
- The reset endpoint accepts no defined route parameters, query parameters, or
  request body schema.
- If a client sends a request body, the endpoint ignores it.
- Successful reset uses the same success response convention as existing fan
  action endpoints: HTTP `202` with an empty body.
- Reset failure uses the same failure response convention as existing fan action
  endpoints: HTTP `500` with `ErrorResponse`.
- Reset must not call the fan terminal gateway or execute start, stop, rotate, or
  speed shell commands.
- Reset must use the same persistence storage abstraction as other fan state
  transitions.
- Reset must preserve the existing architecture layering:
  - the controller exposes the HTTP action;
  - the service owns the state transition;
  - persistence remains behind the service-layer state store interface;
  - infrastructure continues to implement persistence.

## Deterministic Behavior
1. Successful reset
- When `POST /api/v1/fan/reset` is called, the fan service sets application state
  to the default OFF state: `isOn=false`, `speed=0`, and `isRotating=false`.
- The fan service saves the default OFF state to the configured persistent file
  through the existing state store.
- The endpoint responds with HTTP `202` and an empty body after the state save
  succeeds.
- A subsequent `GET /api/v1/fan/state` returns the reset default OFF state.
- A process restart using the same persistent file loads the reset default OFF
  state.

2. Existing state independence
- Reset succeeds from any currently valid fan application state, including an
  already OFF state.
- Reset writes the default OFF state even when the current application state is
  already the default OFF state, because the reset action is explicitly requested
  to update the persistent file.

3. Request body handling
- The reset endpoint ignores any request body sent by the client.
- Request bodies do not alter reset behavior, persisted fields, status codes, or
  response body shape.

4. Physical command isolation
- Reset does not call `start`, `stop`, `rotate`, `setSpeed`, or any terminal
  gateway command.
- Reset does not attempt to make the physical fan match the reset application
  state.

5. Failure handling
- If saving the reset state fails, the endpoint responds with HTTP `500` and
  `ErrorResponse` using the thrown error message.
- If saving fails, the operation is considered failed. The implementation must
  avoid reporting success before persistence completes.

## Assumptions
- Reset is an administrative application-state repair action, not a physical fan
  control command.
- Ignoring request bodies is consistent with the current no-payload fan action
  endpoint style.
- The reset state uses the same default OFF state already defined by the fan
  domain and persistence validator.
- The current single-process service model remains unchanged.

## Impact And Regression Considerations
- `SPEC-006` remains authoritative for persisted state format and validation.
- Existing start, stop, rotate, speed, and state endpoint behavior must remain
  unchanged.
- OpenAPI and `.http` artifacts must be updated because the public API contract
  changes.
- Tests must prove reset does not execute terminal gateway commands.
- Tests must prove reset saves state even when the service is already in the
  default OFF state.

## Validation Plan
- Unit tests:
  - reset from ON state sets state to default OFF and saves default OFF state;
  - reset from already default OFF state still saves default OFF state;
  - reset does not call start, stop, rotate, or speed terminal gateway commands;
  - reset propagates state-store save failures without reporting success;
  - reset controller returns `202` with an empty body on success;
  - reset controller ignores a request body;
  - reset controller returns `500` with `ErrorResponse` when the service reset
    fails.
- Contract/documentation checks:
  - `.http` includes `POST /api/v1/fan/reset` without a payload;
  - OpenAPI includes `POST /api/v1/fan/reset` without a request body schema.
- Run:
  - `npm test`
  - `npm run build`
  - `git diff --check`

## Documentation Requirements
- Add this spec file under `specs/`.
- Update `AGENTS.md` active specs after approval.
- Update `http/FanControlAPI.http` for the reset action.
- Update `openapi/device-integration-api.openapi.yaml` for the reset action.
- Update `README.md` only if it documents fan API actions at implementation
  time.

## Acceptance Criteria
- Spec is approved before implementation.
- Implementation plan is approved before implementation.
- Implementation occurs on a dedicated branch, not `main` or `master`.
- `POST /api/v1/fan/reset` resets application state to default OFF and persists
  that state.
- Reset ignores request bodies.
- Reset does not execute physical fan shell commands.
- Reset returns `202` with an empty body on success.
- Reset returns `500` with `ErrorResponse` when persistence fails.
- Existing fan endpoint behavior remains unchanged.
- Business logic and HTTP contract behavior are covered by deterministic tests.
- Build and tests pass before final delivery, or delivery is explicitly marked
  draft.
