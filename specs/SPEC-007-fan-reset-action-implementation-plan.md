# SPEC-007 - Fan Reset Action Implementation Plan

## Status
Approved

## Spec Reference
- `specs/SPEC-007-fan-reset-action.md`

## Target Branch
- `feature/spec-007-fan-reset-action`

## Scope Boundary
- Implement only the reset behavior approved by `SPEC-007`.
- Do not change physical fan command behavior.
- Do not change existing fan endpoint semantics except adding
  `POST /api/v1/fan/reset`.
- Do not perform additional product, architecture, scope, or planning research
  during implementation.

## Affected Files
- `src/fan/services/FanServiceInterface.ts`
- `src/fan/services/FanService.ts`
- `src/fan/controllers/FanController.ts`
- `tests/fan/services/FanService.test.ts`
- Controller HTTP tests, if the implementation identifies an existing controller
  test convention; otherwise add the minimal controller test file needed for
  `FanController`.
- `http/FanControlAPI.http`
- `openapi/device-integration-api.openapi.yaml`
- `AGENTS.md`
- `README.md` only if it documents fan API actions at implementation time.

## Implementation Steps
1. Branch setup
- Verify the current branch and worktree state.
- Create or switch to `feature/spec-007-fan-reset-action` from the appropriate
  base branch before production implementation.
- Preserve unrelated user changes.

2. Test-first work
- Add or update deterministic `FanService` tests before production service
  implementation:
  - reset from ON state sets state to default OFF and saves default OFF state;
  - reset from already default OFF state still saves default OFF state;
  - reset does not call start, stop, rotate, or speed terminal gateway commands;
  - reset propagates state-store save failures.
- Add controller-level tests before production controller implementation when a
  local controller testing pattern exists or can be introduced narrowly:
  - successful reset returns `202` with an empty body;
  - reset ignores a request body;
  - failed reset returns `500` with `ErrorResponse`.

3. Service implementation
- Add `reset(): Promise<void>` to `FanServiceInterface`.
- Implement `FanService.reset()` so it:
  - sets service-owned state to the default OFF state using the existing domain
    default/clone patterns;
  - saves the default OFF state through the existing `FanStateStoreInterface`;
  - writes even when current state is already default OFF;
  - does not call any terminal gateway method.
- Ensure failed persistence rejects the reset promise and does not report success.

4. Controller implementation
- Add `POST /api/v1/fan/reset` to `FanController`.
- Ignore `req.body`.
- On success, respond with HTTP `202` and no response body.
- On failure, respond with HTTP `500` and `ErrorResponse` using the error
  message.
- Preserve existing route behavior and route paths.

5. Contract and documentation updates
- Add a reset request to `http/FanControlAPI.http` without a payload.
- Add `POST /api/v1/fan/reset` to
  `openapi/device-integration-api.openapi.yaml` with no request body schema and
  `202`/`500` responses matching existing action endpoint style.
- Add `SPEC-007 - Fan Reset Action` to `AGENTS.md` current active specs after
  approval.
- Update `README.md` only if it currently documents fan API actions or if the
  implementation adds such documentation for endpoint discoverability.

## Required Subagents
Because this is behavior-changing implementation, the implementation command must
use clean-context subagents as required by the repository/global workflow:
- Exactly one test-focused subagent before production implementation.
- Exactly one implementation subagent for production implementation.
- Exactly one code-review subagent after implementation.
- If subagent tooling is unavailable, stop and report the blocker.
- Unit-testing and developer subagents must use `gpt-5.3-codex-spark` per
  workspace instructions.

## Review Requirements
- Review the final diff against `SPEC-007` and this implementation plan.
- Confirm reset has no physical command side effects.
- Confirm reset persists default OFF state even when already OFF.
- Confirm the API contract documents no request body.
- Confirm no unrelated behavior, route, persistence format, or shell command
  changes were introduced.

## Main-Agent QA Requirements
- Run:
  - `npm test`
  - `npm run build`
  - `git diff --check`
- If Docker commands are used for any optional validation, explicitly select and
  verify Docker context `local` before running Docker commands.
- Report any validation that cannot be run and mark delivery draft when required
  validation remains incomplete.

## Commit And Push Expectations
- Commit after tests, build, review, QA, documentation, and final main-agent
  acceptance pass.
- Use a non-draft commit message only if required validation, review, QA, and
  documentation are complete and passing.
- Push the implementation branch after commit when repository access permits.

## Implementation Completion Report Requirements
- Summarize the implemented reset behavior.
- List code-review findings and their resolution.
- List QA findings and their resolution.
- State validation commands run and results.
- State documentation and contract updates.
- State commit and push status.
- State whether delivery is final or draft.
- Confirm final main-agent acceptance was completed.
