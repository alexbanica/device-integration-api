# SPEC-005 - Fan Naming Alignment Implementation Plan

## Status
Approved

## Date
2026-06-05

## Approved Spec
`specs/SPEC-005-fan-naming-alignment.md`

## Target Branch
`spec-005-fan-naming-alignment`

## Repository State Note
At plan creation time, the repository was on `main` with these planning changes:

- `specs/SPEC-005-fan-naming-alignment.md` untracked
- `specs/SPEC-005-fan-naming-alignment-implementation-plan.md` untracked

Implementation must preserve these planning artifacts and must not implement on
`main` or `master`.

## Implementation Plan

1. Create the dedicated implementation branch.
   - Create or switch to `spec-005-fan-naming-alignment`.
   - Preserve existing planning artifacts.
   - Do not revert unrelated user changes.

2. Rename source and test paths.
   - Move `src/ventilator` to `src/fan`.
   - Move `tests/ventilator` to `tests/fan`.
   - Rename ventilator-named source and test files to fan-named equivalents.
   - Keep repository layering unchanged: configurations, controllers,
     controllers requests/responses, dtos, services, and infrastructures.

3. Rename TypeScript symbols and internal references.
   - Rename `Ventilator*` classes, interfaces, DTOs, request/response objects,
     gateway objects, configuration objects, service objects, and test stubs to
     `Fan*`.
   - Rename internal variables and properties from ventilator naming to fan naming
     when they are not response payload fields.
   - Rename `register_ventilator_module` to a fan-named registration function
     using the existing snake_case module-registration style.
   - Update `src/device_integration_api.ts` imports and composition-root wiring.
   - Preserve interface suffix rules and service implementation naming rules.

4. Rename public API routes and request artifacts.
   - Update controller route handlers to register:
     - `GET /api/v1/fan/state`
     - `POST /api/v1/fan/start`
     - `POST /api/v1/fan/stop`
     - `POST /api/v1/fan/rotate`
     - `PUT /api/v1/fan/speed/:speed`
   - Remove old `/api/v1/ventilator/...` route registrations.
   - Do not add redirects, aliases, or compatibility endpoints.
   - Preserve response payload fields, status codes, error payload behavior, and
     command behavior.
   - Rename `http/VentilatorControlAPI.http` to a fan-named file and update labels
     and URLs to `/api/v1/fan/...`.

5. Rename environment configuration contract.
   - Update configuration parsing from `VENTILATOR_*` to `FAN_*`.
   - Update required variable names:
     - `FAN_SCRIPT_DIR`
     - `FAN_BASH_START`
     - `FAN_BASH_STOP`
     - `FAN_BASH_ROTATE`
     - `FAN_BASH_SPEED`
     - `FAN_STANDBY_TIMEOUT_MS`
   - Update validation error messages to reference `FAN_*`.
   - Remove support for old `VENTILATOR_*` variables.
   - Preserve default standby timeout value and validation semantics.

6. Update tests first for renamed behavior and contracts.
   - Update configuration tests to use `FanConfiguration`, `FAN_*`, and `Fan*`
     property names.
   - Update service tests to use `FanService`, `FanTerminalGatewayInterface`, and
     fan-named test doubles.
   - Update gateway tests to use `FanTerminalGateway`, `FanConfiguration`, and
     `FAN_*` values.
   - Add or update controller/API-level tests only if implementation exposes
     controller route behavior through existing testable units; otherwise validate
     route changes through build, OpenAPI, `.http`, and targeted search.

7. Update OpenAPI contract artifacts.
   - Change paths from `/api/v1/ventilator/...` to `/api/v1/fan/...`.
   - Rename summaries and schema component names from ventilator to fan naming.
   - Preserve serialized response payload fields `isOn`, `speed`, and
     `isRotating`.

8. Update documentation and agent guidance.
   - Update `README.md` package descriptions, feature examples, and required
     environment variables to fan naming.
   - Update `AGENTS.md` architecture/package descriptions from `src/ventilator` to
     `src/fan`.
   - Add `SPEC-005 - Fan Naming Alignment` to the active specs list.
   - Keep historical approved specs `SPEC-001` through `SPEC-004` unchanged.

9. Perform targeted cleanup searches.
   - Confirm no `src/ventilator` or `tests/ventilator` paths remain.
   - Confirm current source, tests, HTTP, README, AGENTS, package, and OpenAPI no
     longer use `Ventilator`, `ventilator`, or `VENTILATOR`, except historical spec
     references that explicitly identify prior approved specs.
   - Confirm route strings use `/api/v1/fan`.
   - Confirm environment variable strings use `FAN_*`.
   - Confirm no `/api/v1/ventilator` route handlers remain.

10. Validate.
    - Run `npm test`.
    - Run `npm run build`.
    - Run `git diff --check`.

11. Review and QA.
    - Review the diff against every SPEC-005 deterministic behavior section.
    - Confirm public route rename is intentional and old route handlers are absent.
    - Confirm old `VENTILATOR_*` configuration is unsupported.
    - Confirm command behavior, timeout behavior, wakeup gating, speed transitions,
      idempotency, payload fields, and status codes are unchanged.
    - Treat automated test/build validation plus targeted searches as QA.

12. Commit and push.
    - If all required validation passes, commit with a non-draft message such as
      `feature: rename ventilator module to fan`.
    - If validation, review, QA, or documentation is skipped, blocked, incomplete,
      or failing, use `DRAFT` in the commit summary and mark delivery as draft.
    - Push the implementation branch when repository access is available and
      project policy permits.

## Worker Splits
No worker split is required. The implementation is broad but mechanically coupled:
source paths, TypeScript symbols, route strings, environment variables, tests,
OpenAPI, `.http`, and documentation must stay synchronized in one pass.

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
