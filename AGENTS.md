# Project Agent Contract

## Domain-only test policy

- Automated tests of any kind, including unit, integration, contract, snapshot,
  workflow, and configuration tests, may be created or maintained only for
  deterministic domain source logic in this project.
- Do not create or maintain tests for anything outside domain source logic,
  including application orchestration, infrastructure and adapters,
  presentation, UI and controllers, Docker or container files, GitHub Actions
  or other CI/CD workflows, deployment and configuration, packaging and release
  scripts, tooling, or other operational code.
- Validate non-domain changes with appropriate static, syntax, lint, type,
  structural, build, dry-run, smoke, runtime, or operator checks instead of
  automated tests.
- If this project has no domain source logic, automated testing and test-first
  work are not applicable.
- This policy supersedes any more general testing or validation wording
  elsewhere in this file.

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

- Deterministic domain business logic requires unit tests. The domain-only
  policy above prohibits creating or maintaining automated tests for other
  layers, even where legacy controller, infrastructure, or configuration tests
  remain in the tree.
- GitHub Actions workflow configuration does not require unit tests. Do not
  create unit tests solely for GitHub Actions changes, and remove existing
  GitHub-Actions-specific unit tests when they no longer serve another
  non-workflow behavior.
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

## Durable Documentation Authority

- Current source and configuration define implementation behavior;
  `openapi/device-integration-api.openapi.yaml` defines the public HTTP contract,
  `http/` contains executable examples, and `README.md` owns user/operator,
  Docker, CI, and release guidance. Removed completed specifications remain in
  Git history.
- Never infer hosted or hardware success from local source checks. Docker image
  builds, Forgejo pushes and manifests, ARM64/ARMv6 pulls and smoke tests,
  pigpiod connectivity, packaged IR emission, physical fan behavior, and
  persistent-volume operation require live validation.
