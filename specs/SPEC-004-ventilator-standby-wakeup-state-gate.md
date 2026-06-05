# SPEC-004 - Ventilator Standby Wakeup State Gate

## Status
Approved

## Date
2026-06-05

## Purpose
Correct standby wakeup orchestration so the extra wakeup signal is emitted only when
the application state says the ventilator is ON.

## Problem Statement
`SPEC-003 - Ventilator Standby Wakeup` applies the wakeup pre-command globally after
the standby timeout. That causes two terminal signals after inactivity even when the
ventilator is OFF: one `on_off` wakeup signal and one intended command signal.

When the ventilator is OFF, a single intended signal is sufficient. The wakeup
pre-command must be gated by ventilator ON/OFF state.

## Scope
- In scope:
  - Correct standby wakeup behavior introduced by `SPEC-003`.
  - Gate wakeup pre-command execution by the service's in-memory ventilator state.
  - Keep the existing timeout configuration and threshold behavior.
  - Keep HTTP endpoints, payloads, and status codes unchanged.
  - Add or update deterministic unit tests for ON and OFF timeout scenarios.
- Out of scope:
  - Changing the physical command names or environment variable names.
  - Adding persistent state or external device state detection.
  - Changing speed, rotate, start, or stop API contracts.
  - Adding retry, backoff, debounce, or duplicate-signal suppression outside the
    standby wakeup gate.

## Definitions
- Ventilator ON state: the process-local service state where `isOn=true`.
- Ventilator OFF state: the process-local service state where `isOn=false`.
- Standby timeout: `VENTILATOR_STANDBY_TIMEOUT_MS`, as defined by `SPEC-003`.
- Inactivity window: elapsed wall-clock time since the last successful intended
  ventilator terminal command.
- Wakeup pre-command: one execution of `VENTILATOR_BASH_START`, used only before an
  intended command when both the standby timeout is reached and the ventilator is ON.
- Intended command: the terminal command requested by service behavior (`start`,
  `stop`, `rotate`, or speed-step command).

## Inputs And Constraints
- The only source of ON/OFF truth for this behavior is the existing in-memory
  `VentilatorService` state.
- Timeout comparison remains `elapsedMs >= ventilatorStandbyTimeoutMs`.
- The first command after process start still does not trigger wakeup.
- The implementation must preserve the repository's layering:
  - service logic owns ventilator state decisions;
  - infrastructure executes terminal commands behind an interface;
  - controllers and HTTP DTOs remain unchanged.

## Deterministic Behavior
1. Timeout reached while ventilator is ON
- If an intended command is requested after the standby timeout is reached and the
  current service state is ON:
  - execute exactly one wakeup pre-command;
  - if wakeup succeeds, execute the intended command;
  - if wakeup fails, do not execute the intended command and propagate existing
    failure behavior.

2. Timeout reached while ventilator is OFF
- If an intended command is requested after the standby timeout is reached and the
  current service state is OFF:
  - execute only the intended command;
  - do not execute a wakeup pre-command.

3. Timeout not reached
- If an intended command is requested before the standby timeout is reached:
  - execute only the intended command, regardless of ON/OFF state.

4. State transitions
- `start` while OFF remains one intended signal and sets state to ON only after the
  intended command succeeds.
- `stop` while ON remains subject to the ON-state wakeup gate; after successful stop,
  state becomes OFF.
- `stop` while OFF remains idempotent and emits no signal.
- `setSpeed(speed>0)` while OFF keeps existing auto-start behavior; the auto-start
  emits one start signal even when timeout has elapsed because state is OFF before
  the start succeeds.
- Speed-step commands after an auto-start evaluate wakeup behavior using the updated
  ON state and current inactivity window.
- `rotate` while OFF emits only the rotate intended signal, even when timeout has
  elapsed, and leaves `isRotating=false`.

5. Timestamp updates
- Last successful command timestamp remains based on successful intended command
  execution.
- A successful wakeup pre-command alone does not update the last successful intended
  command timestamp.

## Assumptions
- The application in-memory state is the authoritative state for whether wakeup is
  needed.
- The physical device does not need a separate wakeup signal before a start command
  when the application state is OFF.
- Existing `SPEC-001` idempotency and state-transition rules remain authoritative
  except where this spec explicitly narrows `SPEC-003` wakeup behavior.

## Impact And Regression Considerations
- `SPEC-003` global wakeup behavior is superseded only for OFF-state command
  execution.
- The gateway interface may need to accept standby eligibility or the service may
  need separate gateway methods for standby-aware versus direct execution.
- Existing tests that assert timeout always causes wakeup must be updated to include
  ON-state eligibility.
- API contract tests and `.http` files are not expected to change because this is an
  internal orchestration bug fix.

## Validation Plan
- Unit tests:
  - timeout reached while ON executes wakeup then intended command;
  - timeout reached while OFF executes only intended command;
  - start while OFF after timeout executes only start;
  - rotate while OFF after timeout executes only rotate and keeps rotating false;
  - stop while ON after timeout executes wakeup then stop;
  - wakeup failure while ON prevents intended command and propagates failure;
  - timeout not reached executes only intended command.
- Run:
  - `npm test`
  - `npm run build`
  - `git diff --check`

## Documentation Requirements
- Add this spec file under `specs/`.
- Update `AGENTS.md` active specs after approval.
- Update `README.md` only if implementation changes documented environment or
  operating behavior.

## Acceptance Criteria
- Spec is approved before implementation.
- Implementation plan is approved before implementation.
- Implementation occurs on a dedicated branch, not `main` or `master`.
- The corrected behavior maps directly to this spec.
- Build and tests pass before final delivery, or delivery is explicitly marked draft.
