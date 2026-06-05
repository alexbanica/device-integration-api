# Project Agent Contract

## Spec-Driven Rule
- No implementation without an approved spec.
- Every behavior change must map 1:1 to a spec section.
- If Purpose, Definitions, Behavior, Invariants, Constraints, or Assumptions are ambiguous, clarify before coding.

## Architecture
- Keep modular separation by package under `src` (`common`, `fan`, and future packages).
- Apply DDD-style layering with onion-oriented dependency direction:
  - Controllers -> Services Interfaces -> Domain/DTOs
  - Infrastructure implements interfaces and is wired in composition root.
- Dependency direction is inward: controllers and infrastructure depend on service/domain contracts, while service contracts and DTOs remain independent of Express, shell execution, GPIO, Docker, and process-runtime concerns.
- `src/device_integration_api.ts` is the application entrypoint and composition root.
- `src/common` contains shared HTTP/application primitives.
- `src/fan` contains the fan bounded context.
- Entities represent datastore-backed objects.
- DTOs represent non-persistent payload/state objects.

## Project-Specific Architecture
- `src/common/controllers`: application-level REST controllers, currently health/status.
- `src/common/controllers/responses`: shared HTTP response DTOs.
- `src/common/dtos` and `src/common/enums`: common application state contracts.
- `src/common/infrastructures`: shared runtime adapters; `TerminalExecutorInterface` is the shell execution port and `LocalMachineTerminal` is the local adapter.
- `src/fan/configurations`: environment/config loading and validation for fan shell integration.
- `src/fan/controllers`: versioned fan REST API boundary.
- `src/fan/controllers/requests` and `src/fan/controllers/responses`: HTTP DTOs for fan commands and state.
- `src/fan/dtos`: service-level fan state objects.
- `src/fan/services`: fan use-case orchestration behind `FanServiceInterface`.
- `src/fan/infrastructures`: terminal/gateway adapters behind `FanTerminalGatewayInterface`.
- Root `http/` files document and exercise controller contracts.

## Coding Rules
- One class per file.
- All package names are plural.
- Every interface name ends with `Interface`.
- Service implementations use interface name without `Interface` suffix.
- Controllers use request/response objects in `controllers/requests` and `controllers/responses`.

## Testing and Validation
- Business logic requires unit tests.
- Build and tests must pass before completion.

## Documentation
- `README.md` and `AGENTS.md` must stay current.
- Each approved spec must be stored as a dedicated `.md` file under `specs/`.
- `.http` files are required for each controller under `/http`.
- Update Swagger/OpenAPI only when API contract changes.
- Add OpenAPI event docs only when consumed/published events are introduced.

## Branching
- Each spec is implemented in its own branch.
- Do not implement specs in `main`/`master`.

## Current Active Specs
- Historical approved spec retained without rewrite: `SPEC-001 - Ventilator Module Alignment` (`specs/SPEC-001-ventilator-module-alignment.md`, status: Approved, date: 2026-02-26)
- `SPEC-002 - Docker Pigpiod Cleanup` (`specs/SPEC-002-docker-pigpiod-cleanup.md`, status: Approved, date: 2026-02-26)
- Historical approved spec retained without rewrite: `SPEC-003 - Ventilator Standby Wakeup` (`specs/SPEC-003-ventilator-standby-wakeup.md`, status: Approved, date: 2026-03-01)
- Historical approved spec retained without rewrite: `SPEC-004 - Ventilator Standby Wakeup State Gate` (`specs/SPEC-004-ventilator-standby-wakeup-state-gate.md`, status: Approved, date: 2026-06-05)
- `SPEC-005 - Fan Naming Alignment` (`specs/SPEC-005-fan-naming-alignment.md`, status: Approved, date: 2026-06-05)
