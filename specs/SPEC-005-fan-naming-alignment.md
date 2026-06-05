# SPEC-005 - Fan Naming Alignment

## Status
Approved

## Date
2026-06-05

## Purpose
Rename the current ventilator bounded-context repository naming, public API
contract, and deployment configuration naming to fan naming.

## Problem Statement
The device represented by the current `ventilator` package is a fan. Internal
repository naming still uses `ventilator` in folder paths, file names, class names,
interfaces, DTOs, tests, and module registration. This makes the codebase harder to
read and misaligns internal naming with the device domain.

The rename must be deterministic and permanent. Backward compatibility with
ventilator-named routes or environment variables is not required.

## Scope
- In scope:
  - Rename the `src/ventilator` package folder to `src/fan`.
  - Rename `tests/ventilator` test folders to `tests/fan`.
  - Rename ventilator-named TypeScript files, classes, interfaces, DTOs, request
    objects, response objects, gateway objects, configuration objects, and module
    registration functions to fan-named equivalents.
  - Update internal imports and composition-root wiring to use fan-named paths and
    symbols.
  - Update test code to use fan-named paths and symbols.
  - Update repository guidance and user-facing documentation where they describe
    current package/file/class naming.
  - Rename public HTTP routes from `/api/v1/ventilator/...` to
    `/api/v1/fan/...`.
  - Rename documented and parsed environment variables from `VENTILATOR_*` to
    `FAN_*`.
  - Update `.http` files to use fan naming and fan request URLs.
  - Update OpenAPI paths, summaries, and schema component names to fan naming.
- Out of scope:
  - Rewriting historical approved specs (`SPEC-001` through `SPEC-004`).
  - Adding redirects, aliases, or compatibility endpoints for old ventilator
    routes.
  - Changing request or response payload field names.
  - Changing shell command behavior, standby behavior, state behavior, speed
    behavior, or rotation behavior.
  - Adding new device packages.

## Definitions
- Fan bounded context: the renamed package that contains the existing device
  control behavior currently implemented under `src/ventilator`.
- Internal naming: repository paths, filenames, TypeScript symbols, imports,
  test paths, comments, and documentation labels.
- Public contract: HTTP route paths, HTTP methods, request payloads, response
  payloads, status codes, documented environment variable names, OpenAPI contract
  artifacts, and shell command semantics consumed by external clients or
  deployment configuration.
- Historical specs: approved spec files that describe previous behavior and remain
  immutable records for this rename.

## Inputs And Constraints
- New public HTTP routes are:
  - `GET /api/v1/fan/state`
  - `POST /api/v1/fan/start`
  - `POST /api/v1/fan/stop`
  - `POST /api/v1/fan/rotate`
  - `PUT /api/v1/fan/speed/:speed`
- Old `/api/v1/ventilator/...` routes are removed and do not redirect.
- New environment variables are:
  - `FAN_SCRIPT_DIR`
  - `FAN_BASH_START`
  - `FAN_BASH_STOP`
  - `FAN_BASH_ROTATE`
  - `FAN_BASH_SPEED`
  - `FAN_STANDBY_TIMEOUT_MS`
- Old `VENTILATOR_*` environment variables are not supported by this spec.
- Existing response body shape remains `isOn`, `speed`, and `isRotating` because
  those fields describe state, not the device name.
- Existing route input validation behavior is preserved under fan-named internal
  request classes.
- Package architecture and layering remain unchanged:
  - controllers depend on service interfaces;
  - services depend on gateway interfaces;
  - infrastructure implements terminal execution behind interfaces;
  - composition root wires concrete implementations.
- Branch-based delivery is required for implementation.

## Deterministic Behavior
1. Source and test package rename
- All source files currently under `src/ventilator` are moved under `src/fan`.
- All tests currently under `tests/ventilator` are moved under `tests/fan`.
- No compiled output or generated artifact directories are committed as part of the
  rename.

2. TypeScript symbol rename
- TypeScript symbols with `Ventilator` in their name are renamed to the equivalent
  `Fan` symbol.
- The module registration function is renamed from `register_ventilator_module` to
  a fan-named function using the repository's existing function naming style.
- Internal variable and property names are renamed from ventilator-oriented names
  to fan-oriented names when they are not public contracts.
- Interface suffix rules remain unchanged; fan interfaces must end with
  `Interface`.

3. Public contract rename
- HTTP route paths use `/api/v1/fan/...`.
- No `/api/v1/ventilator/...` route handlers remain registered.
- HTTP status codes and payload field names remain unchanged.
- `FAN_*` environment variables are the only supported configuration variable
  names for this change.
- Startup validation errors reference `FAN_*` variable names.
- Runtime command execution, timeout comparison, wakeup gating, speed transitions,
  idempotency, and in-memory state semantics remain unchanged.

4. Documentation and contract artifacts
- `README.md` and `AGENTS.md` are updated to describe `src/fan`, `tests/fan`, and
  fan-named internal classes where applicable.
- Historical specs remain unchanged.
- The new spec is added to the active/current spec list after approval.
- `.http` coverage remains present for the controller and uses `/api/v1/fan/...`
  request URLs.
- OpenAPI paths, summaries, and schema component names use fan naming while the
  serialized response payload remains unchanged.

## Assumptions
- The requested rename is both an internal naming alignment and a public contract
  migration.
- Existing clients and deployments are expected to update from ventilator naming to
  fan naming.
- Existing behavior from `SPEC-001` through `SPEC-004` remains authoritative except
  where this spec changes naming.

## Impact And Regression Considerations
- This is a broad mechanical rename with high import-path and symbol-reference
  regression risk.
- Case-sensitive paths and TypeScript file references must be validated by a clean
  build.
- OpenAPI updates must intentionally change route paths and schema names to fan
  naming without changing response payload fields.
- `.http` updates must use the new `/api/v1/fan/...` URLs.
- Historical specs continuing to mention ventilator is expected and must not be
  treated as failed cleanup.

## Validation Plan
- Run targeted search after implementation:
  - no `src/ventilator` or `tests/ventilator` paths remain;
  - no current source, tests, HTTP, README, AGENTS, package, or OpenAPI references
    use `Ventilator`, `ventilator`, or `VENTILATOR`, except historical approved
    specs and references that explicitly identify historical specs;
  - public route strings use `/api/v1/fan`;
  - environment variable strings use `FAN_*`;
  - no `/api/v1/ventilator` route handlers remain.
- Run:
  - `npm test`
  - `npm run build`
  - `git diff --check`

## Documentation Requirements
- Update `README.md` package and configuration descriptions.
- Update `AGENTS.md` architecture/package descriptions and active spec list after
  approval.
- Keep historical approved specs unchanged.
- Update `.http` labels, file names, and request URLs to fan naming.
- Update OpenAPI paths, labels, and schema component names to fan naming while
  preserving payload field compatibility.

## Acceptance Criteria
- Spec is approved before implementation.
- Implementation plan is approved before implementation.
- Implementation occurs on a dedicated branch, not `main` or `master`.
- Internal source and test naming uses fan-oriented files, folders, and TypeScript
  symbols.
- Public HTTP routes and environment variables use fan naming.
- Old ventilator HTTP routes and environment variables are removed.
- Payload fields, status codes, and command behavior remain unchanged.
- Historical specs remain unchanged.
- Build and tests pass before final delivery, or delivery is explicitly marked
  draft.
