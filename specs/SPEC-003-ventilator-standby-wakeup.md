# SPEC-003 - Ventilator Standby Wakeup

## Status
Approved

## Date
2026-03-01

## Purpose
Ensure deterministic ventilator command execution when the physical device enters standby after inactivity by introducing an environment-configurable standby timeout and a wakeup pre-command strategy.

## Scope
- In scope:
  - Add configuration for standby timeout from environment.
  - Apply wakeup behavior to command execution path when standby timeout is exceeded.
  - Keep API contract unchanged; behavior is internal command orchestration.
  - Add/adjust unit tests for standby timeout and wakeup behavior.
- Out of scope:
  - Changes to endpoint paths, request/response payloads, or status codes.
  - Persistent storage of state/telemetry.
  - New retry/backoff policies beyond the described wakeup pre-command.

## Definitions
- Standby timeout (`ventilatorStandbyTimeoutMs`): max allowed inactivity duration (in milliseconds) since last successful terminal command execution before the next command is considered at risk of being consumed as wakeup.
- Inactivity window: elapsed wall-clock time since last successful command execution for ventilator control.
- Wakeup pre-command: one execution of ventilator `on_off` command used only to bring device out of standby before the intended command.
- Intended command: the command originally requested by service logic (`start`, `stop`, `rotate`, or speed-step command).

## Behavioral Requirements
1. Environment configuration
- Introduce required env variable `VENTILATOR_STANDBY_TIMEOUT_MS`.
- Value MUST be parsed as integer milliseconds.
- Value MUST be greater than or equal to `0`.
- Missing, non-integer, or negative values MUST fail startup via `VentilatorConfigurationError`.

2. Standby-aware command orchestration
- For each intended command execution, compute inactivity window from last successful ventilator command timestamp.
- If inactivity window is greater than or equal to configured timeout:
  - Execute wakeup pre-command once (`on_off`).
  - Execute intended command after wakeup pre-command succeeds.
- If inactivity window is lower than configured timeout:
  - Execute only the intended command.

3. Timestamp updates
- On successful intended command execution, update last successful command timestamp to current time.
- On successful wakeup pre-command execution, do not treat wakeup as final business action; timestamp behavior MUST remain deterministic and consistent with intended command result.

4. Error handling
- If wakeup pre-command fails, intended command MUST NOT execute and the existing error path MUST propagate failure.
- If intended command fails after successful wakeup pre-command, propagate existing failure behavior unchanged.

5. API behavior invariance
- Existing HTTP endpoints, payloads, and status codes remain unchanged.
- Existing domain state transitions remain unchanged; only command execution orchestration is extended.

## Invariants
- No wakeup pre-command is issued when inactivity window is within timeout.
- At most one wakeup pre-command is executed per intended command execution.
- Standby logic must be deterministic for equal `(lastSuccessfulTimestamp, now, timeout)` inputs.

## Constraints
- Preserve current package architecture and interface-driven dependencies.
- One class per file and existing naming rules remain mandatory.
- Add test coverage for both timeout-exceeded and non-exceeded flows.

## Assumptions
- Device wakeup action is exactly one `on_off` command.
- Timeout applies globally to all ventilator terminal commands.
- Inactivity evaluation uses process-local monotonic progression from application wall clock.
- First command after process start does not trigger wakeup pre-command.
- Consecutive commands within timeout never trigger wakeup pre-command.
- `stop` follows same standby-aware orchestration: wakeup+stop only when inactivity window is greater than or equal to timeout.

## Test Requirements
- Configuration tests:
  - accepts valid non-negative integer timeout.
  - rejects missing timeout.
  - rejects non-integer timeout.
  - rejects negative timeout.
- Service/gateway orchestration tests:
  - timeout exceeded => `on_off` then intended command.
  - timeout not exceeded => intended command only.
  - wakeup failure => intended command not executed.
  - intended command failure after wakeup => failure propagated.

## Documentation Requirements
- Add this spec file under `specs/`.
- Update `AGENTS.md` active specs list with draft status.
- Update `README.md` environment variables section when implementation is approved and completed.

## Acceptance Criteria
- Dedicated branch exists for this spec.
- Spec approved.
- Ambiguities resolved in this document before implementation.
