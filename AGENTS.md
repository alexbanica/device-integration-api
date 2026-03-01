# Project Agent Contract

## Spec-Driven Rule
- No implementation without an approved spec.
- Every behavior change must map 1:1 to a spec section.
- If Purpose, Definitions, Behavior, Invariants, Constraints, or Assumptions are ambiguous, clarify before coding.

## Architecture
- Keep modular separation by package under `src` (`common`, `ventilator`, and future packages).
- Apply DDD-style layering with onion-oriented dependency direction:
  - Controllers -> Services Interfaces -> Domain/DTOs
  - Infrastructure implements interfaces and is wired in composition root.
- Entities represent datastore-backed objects.
- DTOs represent non-persistent payload/state objects.

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
- `SPEC-001 - Ventilator Module Alignment` (`specs/SPEC-001-ventilator-module-alignment.md`, status: Approved, date: 2026-02-26)
- `SPEC-002 - Docker Pigpiod Cleanup` (`specs/SPEC-002-docker-pigpiod-cleanup.md`, status: Approved, date: 2026-02-26)
- `SPEC-003 - Ventilator Standby Wakeup` (`specs/SPEC-003-ventilator-standby-wakeup.md`, status: Approved, date: 2026-03-01)
