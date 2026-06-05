# SPEC-006 - Fan State Persistence Implementation Plan

## Status
Approved

## Date
2026-06-05

## Approved Spec
`specs/SPEC-006-fan-state-persistence.md`

## Target Branch
`spec-006-fan-state-persistence`

## Repository State Note
At plan creation time, the repository was on
`spec-006-fan-state-persistence` with these planning changes:

- `AGENTS.md` modified
- `specs/SPEC-006-fan-state-persistence.md` untracked
- `specs/SPEC-006-fan-state-persistence-implementation-plan.md` untracked

Implementation must preserve these planning artifacts and must not implement on
`main` or `master`.

## Implementation Plan

1. Confirm implementation branch and planning artifacts.
   - Use `spec-006-fan-state-persistence`.
   - Preserve existing planning artifacts.
   - Do not revert unrelated user changes.

2. Write deterministic tests before production changes.
   - Add or update fan service tests for:
     - loading valid persisted state as the initial service state;
     - saving after successful `start`, `stop`, `rotate`, and `setSpeed`;
     - skipping saves for idempotent no-op operations;
     - skipping saves for validation failures and failed terminal commands.
   - Add filesystem state-store tests for:
     - missing file creates parent directory, writes default OFF state during
       startup load, and returns that state;
     - valid state file loads successfully;
     - malformed JSON fails load with a fan state persistence error;
     - invalid state invariants fail load with a fan state persistence error;
     - save writes stable JSON containing only `isOn`, `speed`, and
       `isRotating`;
     - save uses a temporary file in the same directory and renames over the
       configured state file.
   - Add configuration tests for:
     - default `FAN_STATE_FILE_PATH` as `./state/fan-state.json`;
     - custom `FAN_STATE_FILE_PATH`.

3. Add service-layer persistence contract and error type.
   - Add a fan service-layer state store interface ending in `Interface`.
   - Define load and save operations around `FanStateDto`.
   - Keep the interface independent of Express, Docker, filesystem APIs, shell
     execution, and process runtime details.
   - Add a fan state persistence error class for load/validation/write failures.

4. Add fan state validation and cloning behavior.
   - Validate persisted state fields and invariants from SPEC-006.
   - Reject missing, extra-behavior-changing, wrong-type, non-integer, or
     out-of-range state data.
   - Ensure service state cannot be mutated externally through store or controller
     references beyond the existing DTO contract expectations.

5. Implement filesystem state store in fan infrastructure.
   - Read and parse the configured JSON state file.
   - On startup load, create the parent directory and write default OFF state when
     the state file is absent.
   - Create parent directories for saves.
   - Write stable JSON with only `isOn`, `speed`, and `isRotating`.
   - Write atomically by writing to a temporary file in the same directory and
     renaming it over the configured state file.
   - Surface clear fan state persistence errors for read, parse, validation, and
     write failures.

6. Update fan configuration.
   - Add `FAN_STATE_FILE_PATH`.
   - Default missing `FAN_STATE_FILE_PATH` to `./state/fan-state.json`.
   - Preserve existing required fan command variables and standby timeout
     validation.

7. Update `FanService`.
   - Accept a state store and initial loaded state through construction or an
     explicit startup factory consistent with the existing composition root.
   - Preserve existing command behavior, wakeup eligibility, idempotency, speed
     transitions, and errors.
   - Save state only after successful state-changing operations.
   - Do not save for no-op idempotent operations, validation failures, or failed
     terminal commands.

8. Update composition root wiring.
   - In `src/fan/fan.ts`, construct `FanConfiguration`, filesystem state store,
     terminal gateway, and `FanService`.
   - Load or create persisted state during startup before registering
     `FanController`.
   - Allow startup to fail when persisted state is malformed, unreadable, invalid,
     or cannot be written.

9. Update Docker runtime volume exposure.
   - Declare `/app/state` as a Docker volume directory in `docker/Dockerfile`.
   - Preserve `/app` as the runtime working directory.
   - Do not add Docker Compose unless it already exists or becomes necessary for
     validation.

10. Update documentation and agent guidance.
    - Update `README.md` fan environment variable documentation to include
      optional `FAN_STATE_FILE_PATH`.
    - Update `README.md` Docker run guidance to mount a volume at `/app/state`.
    - Keep `.http` files and OpenAPI unchanged because HTTP contracts do not
      change.
    - Keep `AGENTS.md` active spec entry for SPEC-006.

11. Validate.
    - Run `npm test`.
    - Run `npm run build`.
    - Run `git diff --check`.
    - If Docker QA is performed, first select and verify Docker context `local`.

12. Review and QA.
    - Review the diff against every SPEC-006 deterministic behavior section.
    - Confirm persistence does not alter API payloads, status codes, command
      behavior, speed transitions, or standby wakeup behavior.
    - Confirm startup creates a missing file before controller registration.
    - Confirm invalid persisted state fails startup.
    - Treat automated tests/build plus diff review as required QA; Docker restart
      validation is manual QA when Docker is available.

13. Commit and push.
    - If all required validation passes, commit with a non-draft message such as
      `feature: persist fan state`.
    - If validation, review, QA, or documentation is skipped, blocked, incomplete,
      or failing, use `DRAFT` in the commit summary and mark delivery as draft.
    - Push the implementation branch when repository access is available and
      project policy permits.

## Worker Splits
No worker split is required. The implementation is focused but coupled across the
fan service, fan configuration, one filesystem adapter, Docker metadata, tests,
and README updates. A single implementation pass reduces contract drift.

## Validation Commands

```text
npm test
npm run build
git diff --check
```

## Manual Docker QA

When Docker validation is available:

```text
docker context show
docker context use local
docker context show
```

Then build and run with `/app/state` mounted, change fan state through the API,
restart or replace the container with the same mounted volume, and confirm
`GET /api/v1/fan/state` returns the persisted state.

## Clean Context Handoff
Implementation must start only in a new session, after an explicitly cleared
context, or after explicit user confirmation that same-context implementation is
intentional for this invocation.
