# SPEC-004 - Ventilator Standby Wakeup State Gate Implementation Plan

## Status
Approved

## Date
2026-06-05

## Approved Spec
`specs/SPEC-004-ventilator-standby-wakeup-state-gate.md`

## Target Branch
`spec-004-ventilator-standby-wakeup-state-gate`

## Repository State Note
At plan approval time, the repository was on `main` with these planning changes:

- `AGENTS.md` modified
- `specs/SPEC-004-ventilator-standby-wakeup-state-gate.md` untracked

Implementation must preserve these planning artifacts and must not implement on
`main` or `master`.

## Implementation Plan

1. Create the dedicated implementation branch.
   - Create or switch to `spec-004-ventilator-standby-wakeup-state-gate`.
   - Preserve existing planning artifacts.
   - Do not revert unrelated user changes.

2. Write or update deterministic tests before production changes.
   - Update `tests/ventilator/infrastructures/VentilatorTerminalGateway.test.ts`.
   - Update `tests/ventilator/services/VentilatorService.test.ts`.
   - Cover timeout reached while ON executing wakeup then intended command.
   - Cover timeout reached while OFF executing only the intended command.
   - Cover `start` while OFF after timeout executing only start.
   - Cover `rotate` while OFF after timeout executing only rotate and keeping
     `isRotating=false`.
   - Cover `stop` while ON after timeout executing wakeup then stop.
   - Cover wakeup failure while ON preventing the intended command and propagating
     failure.
   - Cover timeout not reached executing only the intended command.

3. Update the gateway contract for service-owned wakeup eligibility.
   - Update `src/ventilator/infrastructures/VentilatorTerminalGatewayInterface.ts`.
   - Allow service calls to indicate whether an intended command is eligible for
     standby wakeup.
   - Keep the interface independent of HTTP, Express, shell details, and process
     runtime concerns.

4. Update `src/ventilator/services/VentilatorService.ts`.
   - Pass wakeup eligibility from current in-memory state.
   - `start` while OFF must pass ineligible.
   - `stop` while ON must pass eligible.
   - `rotate` while OFF must pass ineligible.
   - `rotate` while ON must pass eligible.
   - `setSpeed(speed > 0)` auto-start while OFF must emit a start command with
     wakeup ineligible, then evaluate speed-step wakeup behavior using the updated
     ON state.
   - Preserve existing idempotent no-command paths.

5. Update `src/ventilator/infrastructures/VentilatorTerminalGateway.ts`.
   - Keep timestamp and timeout tracking in the gateway.
   - Execute the wakeup pre-command only when the service marks the intended
     command wakeup-eligible and timeout comparison passes.
   - Keep timeout comparison as `elapsedMs >= ventilatorStandbyTimeoutMs`.
   - Keep first-command behavior unchanged: no wakeup before any successful
     intended command timestamp exists.
   - Update last successful command timestamp only after successful intended
     command execution.
   - Do not update the timestamp for a successful wakeup pre-command alone.

6. Keep API and documentation contracts stable.
   - Do not change controllers, HTTP payloads, status codes, `.http` files, or
     OpenAPI.
   - Do not update `README.md` unless implementation reveals a documented
     operating behavior conflict with SPEC-004.

7. Validate.
   - Run `npm test`.
   - Run `npm run build`.
   - Run `git diff --check`.

8. Review and QA.
   - Review the diff against all SPEC-004 deterministic behavior sections.
   - Confirm OFF-state timeout cases do not emit wakeup.
   - Confirm ON-state timeout cases emit exactly one wakeup before the intended
     command.
   - Confirm wakeup failure prevents intended command execution.
   - Treat automated unit/build validation as QA because the API contract is
     unchanged.

9. Commit and push.
   - If all required validation passes, commit with a non-draft message such as
     `fix: gate ventilator standby wakeup by service state`.
   - If validation, review, QA, or documentation is skipped, blocked, incomplete,
     or failing, use `DRAFT` in the commit summary and mark delivery as draft.
   - Push the implementation branch when repository access is available and
     project policy permits.

## Worker Splits
No worker split is required. The implementation is tightly coupled across one
service, one gateway interface, one gateway implementation, and their focused
unit tests.

## Validation Commands

```text
npm test
npm run build
git diff --check
```

## Clean Context Handoff
Implementation must start only in a new session, after an explicitly cleared
context, or after explicit user confirmation that same-context implementation is
intentional for this invocation.
