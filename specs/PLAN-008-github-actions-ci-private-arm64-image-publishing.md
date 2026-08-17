# PLAN-008 - GitHub Actions CI And Private ARM64 And ARMv6 Image Publishing

## Status
Approved

## Date
2026-08-16

## Approved Spec Reference
- `specs/SPEC-008-github-actions-ci-private-arm64-image-publishing.md`
- Status required at implementation entry: `Approved`.
- Implementation must remain within SPEC-008. A discovered requirement that
  changes triggers, image names, tag mapping, registry ownership, privacy
  behavior, credentials, the exact `linux/arm64,linux/arm/v6` platform set,
  multi-platform representation, local build compatibility, or validation
  requires stopping for a spec/plan amendment.

## Delivery Branch And Expected Base
- Repository: `device-integration-api`.
- Exact delivery branch:
  `feature/spec-008-github-actions-ci-private-arm64-image-publishing`.
- The existing branch name is intentionally preserved from the original
  ARM64-only plan; the approved behavior and this final-state plan now include
  ARMv6 as well.
- Expected base ref: `origin/main`.
- Expected base commit:
  `928cf141afaa7ae7b967e03eef1ca10ee6cc39c6`.
- The invoking checkout remains unchanged for implementation work.
- If `origin/main` no longer resolves to the expected base commit, or the exact
  delivery branch already exists locally/remotely with incompatible history,
  implementation must stop instead of selecting another base or branch.

## Isolated Implementation Worktree
- Task slug: `spec-008-github-actions-ci-private-arm64-image-publishing`.
- Standard path:
  `~/.herdr/worktrees/device-integration-api/spec-008-github-actions-ci-private-arm64-image-publishing`.
- The implementation main agent must:
  1. verify the repository root name is exactly `device-integration-api` and the
     task slug/path exactly match this plan;
  2. create `~/.herdr/worktrees/device-integration-api` when absent;
  3. account for the halted prior implementation worktree currently registered
     at the planned path, detached at the expected base, with only these known
     agent-generated partial paths: modified `package.json`,
     `tests/fan/controllers/FanController.test.ts`, and
     `tests/fan/infrastructures/FanTerminalGateway.test.ts`; untracked
     `tests/docker/BuildScript.test.ts`, `tests/docker/Dockerfile.test.ts`, and
     the prior approved SPEC/PLAN copies;
  4. verify that exact registered path, base, detached state, and changed-path
     set before discarding it; stop if any additional path, branch, base,
     identity, or unrelated change is present;
  5. remove only that verified prior agent-generated worktree and recreate the
     same planned path detached at the expected base commit. Approval of this
     plan explicitly authorizes discarding those reproducible partial changes
     so implementation restarts from the required clean base;
  6. require the recreated worktree to be clean and registered to this
     repository;
  7. materialize the exact updated approved SPEC and PLAN from the invoking
     checkout at their planned paths in the detached worktree before delegating
     work, verify both are byte-identical to the approved invoking-checkout
     artifacts, and keep them immutable;
  8. defer creating the delivery branch until development reaches DRAFT delivery
     or the Definition of Done;
  9. create the exact delivery branch from the detached worktree, then commit and
     push the complete accepted change set.
- Workers must not create, switch, or manage worktrees or branches and must not
  commit or push.

## Clean-Context And No-Research Boundary
- `$implement` may start only in a fresh session, after an explicit context
  clear, or after explicit same-context confirmation for that invocation.
- Before edits, implementation may read only:
  - applicable agent/workspace instructions;
  - the approved SPEC-008 and approved PLAN-008;
  - branch/worktree status;
  - files listed in this plan;
  - minimal adjacent patterns needed to edit or validate those files.
- Do not repeat product, architecture, cross-project, registry-design, workflow-
  design, or scope research during implementation.
- Do not inspect or change any other workspace project.
- The live Forgejo organization, credentials, runner reachability, and registry
  publication remain validation inputs, not authority to redesign approved
  behavior.
- Exact action pins approved for implementation are:
  - `actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803`
    (`v6.1.0`);
  - `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020`
    (`v7.0.0`);
  - `docker/setup-qemu-action@96fe6ef7f33517b61c61be40b68a1882f3264fb8`
    (`v4.2.0`);
  - `docker/setup-buildx-action@bb05f3f5519dd87d3ba754cc423b652a5edd6d2c`
    (`v4.2.0`).
- Use these full SHAs with version comments. Updating them requires a plan
  amendment; implementation must not look up replacements.
- Architecture-agent review is not required: the change is confined to CI,
  build tooling, test entry points, and documentation without application-layer
  architecture changes.

## Affected Files
- Approved artifacts, updated during this iteration and then immutable during
  implementation:
  - `specs/SPEC-008-github-actions-ci-private-arm64-image-publishing.md`;
  - `specs/PLAN-008-github-actions-ci-private-arm64-image-publishing.md`.
- Locked dependency metadata:
  - `.gitignore`;
  - `package-lock.json`.
- CI workflows:
  - `.github/workflows/ci.yml` (new);
  - `.github/workflows/publish-docker-images.yml` (new).
- Project check entry points and existing lint baseline:
  - `package.json`;
  - `tests/fan/controllers/FanController.test.ts`;
  - `tests/fan/infrastructures/FanTerminalGateway.test.ts`.
- Docker behavior and deterministic tests:
  - `tests/docker/BuildScript.test.ts` (new);
  - `tests/docker/Dockerfile.test.ts` (new);
  - `docker/build.sh`;
  - `docker/Dockerfile`;
  - `docker/.dockerignore` (new).
- Documentation:
  - `README.md`;
  - `AGENTS.md`.
- `docker/.env`, application source, OpenAPI, and controller `.http` files are
  not expected to change. If an in-scope requirement cannot be met without
  another path, stop for a plan amendment before editing it.

## Approved Implementation Contracts

### Locked Dependency Metadata
- Remove only the `package-lock.json` exclusion from `.gitignore`; preserve all
  other ignore behavior.
- Generate or update `package-lock.json` from the unchanged current
  `package.json`, retain lockfile version 3, and commit it as an ordinary tracked
  file rather than force-adding an ignored stale copy.
- The lockfile root dependency and development-dependency declarations must
  exactly match `package.json`; in particular it must not retain the stale
  `pigpio-client` root dependency.
- A clean `npm ci` must succeed from the committed manifest/lockfile pair.
- Do not add, remove, or intentionally upgrade direct dependency declarations in
  `package.json` as part of the lockfile correction.

### Project Checks
- Change `npm run lint` to the same ESLint target without `--fix`.
- Add `npm run lint:fix` with the existing fix-in-place behavior.
- Correct only the two SPEC-008 lint baseline violations; do not alter assertions
  or product behavior.
- Make `npm test` compile through `npm run build:test`, enumerate every compiled
  `dist-tests/tests/**/*.test.js` file without relying on Node directory
  resolution, fail on an empty selection, and pass every selected file to
  `node --test`.
- CI uses declared Node 20, setup-node npm caching based on `package-lock.json`,
  `npm ci`, `npm run lint`, and `npm test`.

### Docker Build Interface
- Preserve `--debug`, `--platform`, `--push`, `--force`, and `--release`.
- Add explicit CI-safe inputs for:
  - registry prefix;
  - source revision distinct from release/image tag;
  - GitHub authentication secret file;
  - Buildx `cache-from`;
  - Buildx `cache-to`.
- Resolve tracked `.env`, `Dockerfile`, `.dockerignore`, secret defaults, and
  build context from the script directory so the README root invocation works.
- Load tracked `.env` values as local defaults while allowing explicit CI inputs
  to override them without modifying `docker/.env`.
- Reject missing option values and unknown options; validate release image tag,
  source revision, registry prefix, secret readability, and platform expression
  before invoking Docker.
- Default local source revision to the release value and default local registry
  to tracked `registry.pi.home:5000`; retain both existing local tags and no-push
  default.
- In CI, produce only:
  - `forgejo.alexlab.nl/alexlab/device-integration-api:${GIT_TAG}-node${BASE_IMAGE_VERSION}`;
  - `forgejo.alexlab.nl/alexlab/device-integration-api:latest-node${BASE_IMAGE_VERSION}`;
  as multi-platform images containing exactly `linux/arm64` and
  `linux/arm/v6`, created by one Buildx invocation whose platform argument is
  exactly `linux/arm64,linux/arm/v6`.
- Keep `docker/build.sh` as the sole image inventory and build invocation.

### Dockerfile And Context
- Rename/separate the source selector so CI can download the archive for the
  immutable event commit SHA while image tags retain the Git tag name.
- Use `npm ci --silent` against the downloaded revision's tracked lockfile before
  `npm run build`.
- Preserve the downloader/builder/runtime structure, base versions, runtime
  behavior, entrypoint, state volume, and exposed port.
- Exclude `secrets/`, `.github_auth`, and equivalent credential files from the
  ordinary Docker context; authentication remains a BuildKit secret mount only.

### GitHub Workflows
- `.github/workflows/ci.yml`:
  - triggers on pull requests whose base is `main` and pushes to `main`;
  - has `permissions: contents: read`;
  - checks out the event revision without persisted credentials;
  - uses Node 20 with npm cache, then `npm ci`, `npm run lint`, and `npm test`;
  - references no Forgejo secret and performs no Docker publication.
- `.github/workflows/publish-docker-images.yml`:
  - triggers on every pushed tag with a tag pattern that includes `/`;
  - has `permissions: contents: read` and no GitHub package-write permission;
  - checks out the tag event revision without persisted credentials;
  - validates both exact Forgejo secret names without printing values;
  - validates Docker tag grammar and exact registry prefix before login;
  - queries `https://forgejo.alexlab.nl/api/v1/orgs/alexlab` with the Forgejo
    token and requires owner `alexlab` with `visibility` equal to `private`;
  - treats DNS, trusted TLS, HTTP, authentication, JSON, owner, or visibility
    failure as a pre-login, pre-push failure;
  - sets up QEMU before Buildx and verifies Buildx advertises both
    `linux/arm64` and `linux/arm/v6`;
  - writes `${{ github.token }}` only to a mode-`0600` file below
    `${{ runner.temp }}`, supplies that file as the BuildKit secret source, and
    removes it in an `always()` cleanup step;
  - logs into only `forgejo.alexlab.nl` with
    `FORGEJO_REGISTRY_USERNAME` and token via `--password-stdin`;
  - invokes `./docker/build.sh` once with event SHA, ref name, exact registry,
    exact platform value `linux/arm64,linux/arm/v6`, `--push`, and GHA
    cache-from/cache-to scope `device-integration-api-linux-arm64-armv6`;
  - publishes the existing release and rolling tag names as manifest indexes
    containing exactly those two runnable platform variants, without separate
    architecture-specific tags;
  - does not use `docker/build-push-action`, a workflow-owned image matrix, or
    any other push destination.

## Test-First Applicability
- Test-first is required for `docker/build.sh` and Dockerfile/context contract
  changes because their deterministic path, tagging, platform, cache, source,
  and secret behavior can be exercised without a live Docker daemon.
- Test-first is not applicable to the npm-script correction, the two existing
  test-file lint cleanups, lockfile/ignore correction, workflow YAML, or
  documentation because those are dependency metadata, test-harness,
  configuration, and documentation changes rather than business or domain
  logic. They still require deterministic static and runtime validation.
- No application business/domain behavior changes, so no application unit tests
  beyond existing regression tests are added.

## Dependency-Aware Work Graph

Each subagent assignment below has a hard maximum of five minutes of active
work. At five minutes the main agent must interrupt it, capture completed and
partial work, changed files, validation, blockers, and remaining work, preserve
usable changes, and split the remainder into a smaller clean-context unit. A
timed-out unit must not be retried unchanged.

| ID | Type | Boundary and owned files | Depends on | Acceptance and validation | Clean-context assignment |
|---|---|---|---|---|---|
| D0 | Development | Locked dependency metadata only: `.gitignore`, `package-lock.json` | None; test-first not applicable | Only the lockfile ignore rule is removed; lockfile version 3 is regenerated or updated from unchanged `package.json`; root dependency sets match; stale `pigpio-client` metadata is absent; clean `npm ci` succeeds | `developer`, maximum 5 minutes |
| T1 | Unit test | Build-script contract only: `tests/docker/BuildScript.test.ts` | None | Failing-first tests cover root/caller-independent paths, local defaults, release/source separation, exact tags, exact ordered `linux/arm64,linux/arm/v6` propagation, platform/push/cache behavior, secret-file override, invalid/missing/unknown inputs, and fake-Docker invocation; compile and run the targeted compiled test | `test-writer`, maximum 5 minutes |
| T2 | Unit test | Dockerfile/context contract only: `tests/docker/Dockerfile.test.ts` | None | Failing-first tests prove source-revision use, `npm ci --silent`, preserved runtime contract, BuildKit secret mount, and `.dockerignore` credential exclusions; compile and run the targeted compiled test | `test-writer`, maximum 5 minutes |
| D1 | Development | Build interface only: `docker/build.sh` | T1 completed | T1 passes; `bash -n docker/build.sh`; local defaults and CI overrides, including one exact two-platform Buildx invocation, match the approved contract with fake Docker | `developer`, maximum 5 minutes |
| D2 | Development | Deterministic Docker inputs only: `docker/Dockerfile`, `docker/.dockerignore` | T2 completed | T2 passes; Docker stages/runtime remain unchanged except approved source/install/context behavior | `developer`, maximum 5 minutes |
| D3 | Development | Project checks only: `package.json`, `tests/fan/controllers/FanController.test.ts`, `tests/fan/infrastructures/FanTerminalGateway.test.ts` | D0 completed; test-first not applicable | `npm run lint` is non-mutating and green, `npm run lint:fix` exists, `npm test` selects all five current test files and passes, assertion behavior is unchanged | `developer`, maximum 5 minutes |
| D4 | Development | Default-branch CI only: `.github/workflows/ci.yml` | D0 and D3 completed | Exact `main` PR/push triggers, read-only permissions, pinned checkout/setup-node, lockfile-backed npm cache, install/lint/test sequence, no Forgejo/Docker secrets | `developer`, maximum 5 minutes |
| D5 | Development | Private ARM multi-platform publication only: `.github/workflows/publish-docker-images.yml` | D0, D1, and D2 completed | All-tag trigger, exact pins, fail-closed privacy/registry/tag preflight, secure login/temp secret, QEMU/Buildx verification for both targets, one build-script call, exact two-platform/cache/push inputs, and no architecture-specific tags | `developer`, maximum 5 minutes |
| D6 | Documentation | `README.md`, `AGENTS.md` | D0, D3, D4, and D5 completed | README documents the committed lockfile plus all SPEC-008 operator/developer contracts, including the exact two-platform manifests and ARMv6 validation boundary; AGENTS adds approved SPEC-008 without changing other active specs | `developer`, maximum 5 minutes |
| R1 | Review | Dependency/check/tooling review: `.gitignore`, `package-lock.json`, `package.json`, the two lint-cleanup test files, `tests/docker/BuildScript.test.ts`, `docker/build.sh`, `.github/workflows/ci.yml` | D0, D1, D3, and D4 completed | Report only: manifest/lockfile mismatch, unintended direct dependency changes, spec/plan mismatches, test gaps, shell/tag/path/multi-platform/cache regressions, check-trigger or secret exposure issues; no edits | `code-reviewer`, maximum 5 minutes |
| R2 | Review | Publication/security review: `tests/docker/Dockerfile.test.ts`, `docker/Dockerfile`, `docker/.dockerignore`, `.github/workflows/publish-docker-images.yml` | D2 and D5 completed | Report only: exact ARM64/ARMv6 manifest targets, privacy/auth/cache/context leaks, action-pin errors, Docker runtime regressions, and missing failure paths; no edits | `code-reviewer`, maximum 5 minutes |
| R3 | Review | Final artifact/documentation review: `README.md`, `AGENTS.md`, approved SPEC-008, approved PLAN-008, and integrated staged diff | D6, R1, and R2 completed and findings resolved | Report only: final spec/plan/documentation mismatch, unrelated changes, missing tracked paths, or delivery risk; no edits | `code-reviewer`, maximum 5 minutes |

### Execution Order And Concurrency
- Maximum active test-writer subagents: 2. Start T1 and T2 concurrently.
- Maximum active developer subagents: 2.
  - Start D0 independently in an available developer slot; it may run while
    T1/T2 or unrelated development units are active.
  - Start D1 immediately after T1 and D2 immediately after T2; either may run
    while the unrelated test/development unit remains active.
  - Start D3 after D0; it may use the other developer slot while D1/D2 runs.
  - Start D4 only after D0 and D3, and D5 only after D0, D1, and D2.
  - Start D6 after D0, D3, D4, and D5 are integrated.
- Maximum active code-reviewer subagents: 2. Run R1 and R2 concurrently, resolve
  their findings through new clean-context developer units, then run R3.
- The main agent remains responsible for orchestration, timeout enforcement,
  integration, review triage, QA, worktree/branch management, and final
  acceptance.

### Serialized Integration Points
- D0 exclusively owns `.gitignore` and `package-lock.json`; the main agent
  verifies that `package.json` remained unchanged by the lockfile operation
  before releasing D3 and later D4/D5.
- T1 owns only `BuildScript.test.ts`; D1 owns only `build.sh`. The main agent
  integrates their red/green handoff and prevents either unit from changing the
  other's file.
- T2 owns only `Dockerfile.test.ts`; D2 owns only `Dockerfile` and
  `.dockerignore`. The main agent integrates their red/green handoff.
- D5 is serialized after D0/D1/D2 because it consumes the committed lockfile,
  finalized build-script CLI, and Docker secret/context contract.
- D4 is serialized after D0/D3 because it invokes the finalized npm scripts and
  lockfile-backed cache/install path.
- README/AGENTS ownership is exclusive to D6. Approved SPEC/PLAN artifacts are
  exclusive to the main agent and remain unchanged during implementation.
- Any review/QA fix must be assigned to a new clean-context `developer` with the
  specific finding and only the affected unit's ownership boundary. Reviewers do
  not edit files.

## Main-Agent Integration And QA
1. Verify every completed unit changed only its owned files and inspect its diff
   before starting dependents.
2. Confirm T1/T2 demonstrate failing-first behavior against the expected base,
   then confirm the corresponding D1/D2 changes make them pass.
3. Confirm D0 leaves `package.json` byte-identical, removes only the approved
   ignore entry, produces a tracked version-3 lockfile with matching root
   dependency sets, and supports clean `npm ci`.
4. Run targeted tests after each integration and the full suite after all
   development units.
5. Run R1/R2, route in-scope findings to bounded developer fixes, rerun affected
   validation, and then run R3.
6. Stop for a spec/plan amendment if a finding changes approved behavior or
   requires an unlisted file.
7. Perform final QA personally; do not delegate QA.

## Validation Commands
- Dependency and project validation:
  - confirm `git check-ignore package-lock.json` finds no ignore rule;
  - confirm `git ls-files --error-unmatch package-lock.json` succeeds;
  - confirm lockfile version 3 and exact root dependency/development-dependency
    equality with `package.json`, including absence of stale `pigpio-client`;
  - `npm ci`
  - record `git diff -- src tests package.json | sha256sum` before lint;
  - `npm run lint`
  - record the same scoped diff checksum after lint and require it to be
    unchanged, proving lint did not mutate expected implementation diffs;
  - `npm test`
  - confirm the test output names all five pre-existing compiled test files plus
    both new Docker contract tests;
  - `npm run build`
- Targeted deterministic tests:
  - compile with `npm run build:test`;
  - run the compiled `BuildScript.test.js` directly through `node --test`;
  - run the compiled `Dockerfile.test.js` directly through `node --test`.
- Shell, workflow, and formatting validation:
  - `bash -n docker/build.sh`
  - `actionlint .github/workflows/ci.yml .github/workflows/publish-docker-images.yml`
  - `npx prettier --check package.json README.md AGENTS.md .github/workflows/ci.yml .github/workflows/publish-docker-images.yml`
  - verify each `uses:` reference equals an approved full SHA and has its exact
    version comment;
  - verify the PR workflow contains no `FORGEJO_` or Docker login/push reference;
  - verify the publish workflow has no target other than
    `forgejo.alexlab.nl/alexlab`.
- Repository validation:
  - `git diff --check`
  - inspect `git diff --stat`, `git diff --name-status`, and the complete diff;
  - classify every modified, added, deleted, renamed, and untracked path.
- Docker/live validation:
  - before any Docker command, run `docker context show`; select `local` with
    `docker context use local` when needed; run `docker context show` again;
  - run the script tests with fake Docker regardless of live Docker availability;
  - when credentials, registry reachability, and authorization are available,
    use an explicitly authorized disposable valid tag/workflow run to verify the
    privacy preflight, exact two tags, each tag's exact `linux/arm64` and
    `linux/arm/v6` manifest variants, authenticated pulls for both platforms,
    anonymous pull denial, and absence from other registries;
  - smoke-test the matching runtime variant on ARM64 and ARMv6 hardware when
    available; unavailable runtime validation for either platform keeps delivery
    DRAFT even when manifest inspection succeeds;
  - do not create/push a live tag, publish an image, or change Forgejo/GitHub
    settings unless separately authorized for implementation validation.
- If `actionlint`, live GitHub execution, Forgejo credentials/privacy proof,
  registry reachability, either ARM build/push, exact multi-platform manifest
  inspection, either platform's runtime smoke test, or anonymous access
  validation is unavailable, record it explicitly and mark delivery DRAFT as
  required by SPEC-008.

## Documentation Requirements
- `README.md` must document exact triggers, Node check commands, non-mutating
  lint and local autofix, corrected test behavior, committed-lockfile `npm ci`
  usage, exact secrets and token access, private-owner prerequisite, trusted
  HTTPS/runner assumptions, exact ARM64/ARMv6 multi-platform image tags,
  Buildx/cache behavior, top-level digest change implications, and preserved
  local build defaults.
- `AGENTS.md` must add SPEC-008 to Current Active Specs with Approved status and
  date `2026-08-16`, preserving every prior entry.
- OpenAPI and `.http` files must remain unchanged.
- The completion report must distinguish deterministic local/static validation
  from live GitHub/Forgejo/ARM64/ARMv6 publication and runtime validation.

## Commit, Push, And Final Status Reconciliation
- After development reaches DRAFT delivery or the Definition of Done, create the
  exact delivery branch in the detached implementation worktree.
- Reconcile the entire worktree before staging. Classify every modified, added,
  deleted, renamed, and untracked path and preserve/identify unrelated changes.
- Stage every accepted in-scope path, including the approved SPEC, approved PLAN,
  `.gitignore`, `package-lock.json`, workflows, tests, Docker inputs, README, and
  AGENTS. Do not stage unrelated user changes.
- Inspect `git diff --cached --name-status`, `git diff --cached --stat`, and the
  complete staged diff before committing.
- Commit convention:
  - use `feature: Add GitHub Actions ARM64 and ARMv6 Forgejo publishing` only
    when all required review, QA, documentation, and validation pass;
  - use `feature: DRAFT add GitHub Actions ARM64 and ARMv6 Forgejo publishing`
    when any required item is skipped, blocked, failing, incomplete, or
    unvalidated.
- Push the exact branch to `origin` and configure its upstream. Do not push
  `main`, tags, images, or other refs as part of delivery.
- After commit and push:
  - run `git status --short --branch`;
  - verify no accepted in-scope change remains unstaged, uncommitted, or
    untracked;
  - verify the branch is not ahead of its configured upstream;
  - identify any preserved unrelated change explicitly.
- Do not report completion while an accepted in-scope path is absent from the
  commit or the branch push.

## Completion Report And Final Acceptance
- Report:
  - implemented SPEC-008 behavior;
  - code-review and QA findings and their resolution;
  - validation run, results, and validation not run;
  - live GitHub/Forgejo/ARM64/ARMv6/private-access gaps;
  - documentation updates;
  - every committed path category;
  - commit ID, delivery branch, upstream, and push status;
  - final or DRAFT delivery status;
  - skipped, blocked, incomplete, failing, or unvalidated requirements;
  - whether the complete Definition of Done was satisfied.
- The main agent must inspect the final committed diff, validation evidence,
  branch/upstream state, and worktree status and explicitly confirm final
  main-agent acceptance.
