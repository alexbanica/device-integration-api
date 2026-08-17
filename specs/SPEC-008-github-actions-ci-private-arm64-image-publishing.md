# SPEC-008 - GitHub Actions CI And Private ARM64 And ARMv6 Image Publishing

## Status
Approved

## Date
2026-08-16

## Iteration - ARMv6 Multi-Platform Extension (2026-08-16)
- Requested delta: add `linux/arm/v6` to the approved `linux/arm64` private-image
  publication behavior.
- Final representation: preserve the two approved release and rolling image tag
  names, but publish each as one multi-platform manifest containing exactly
  `linux/arm64` and `linux/arm/v6` variants.
- Preserved behavior: CI checks, tag triggers, immutable source selection,
  Forgejo namespace/privacy/authentication requirements, image tag mapping,
  local build compatibility, locked dependency installation, secret handling,
  and non-ARM platform exclusions remain unchanged except where this section
  explicitly extends platform and manifest validation.
- Confirmed input availability: Docker Hub metadata for the pinned
  `node:19.2.0-alpine3.15` and `alpine:3.15` tags currently lists both
  `linux/arm64` and `linux/arm/v6` variants. The repository's complete ARMv6
  build and runtime remain unverified until implementation validation.

## Iteration - Tracked Lockfile Correction (2026-08-16)
- Requested delta: resolve the implementation-entry finding that the approved
  expected-base commit does not track `package-lock.json`, even though the
  approved CI and Docker behavior requires locked `npm ci` installation.
- Confirmed repository evidence: `.gitignore` currently excludes
  `package-lock.json`; the ignored local version is lockfile version 3 but its
  root dependency set is stale because it still declares `pigpio-client`, which
  current `package.json` does not declare.
- Final representation: stop ignoring `package-lock.json`, regenerate or update
  it from the unchanged current `package.json`, commit the consistent lockfile,
  and use that committed file for local validation, GitHub Actions caching and
  installation, and the Docker source build.
- Preserved behavior: every previously approved CI trigger, lint/test behavior,
  Docker interface, source selection, image name and tag, Forgejo security
  constraint, exact platform set, local build default, dependency declaration,
  API behavior, and validation boundary remains unchanged.

## Purpose
Add GitHub Actions coverage for this repository so pull requests and changes to
the actual default branch are checked with the project's lint and test entry
points, while every pushed Git tag publishes the repository-managed container
image as an exact `linux/arm64` and `linux/arm/v6` multi-platform manifest
exclusively to the private Forgejo container registry.

## Problem Statement
This repository has no GitHub Actions workflows. Its documented lint, test, and
Docker build entry points also cannot be used safely and deterministically in CI
without narrow compatibility changes:

- `npm run lint` currently includes `--fix`, so it mutates checked-out files and
  can conceal fixable violations in CI. A non-mutating run currently reports two
  existing violations in test files.
- `npm test` compiles the tests but passes a directory to Node's test runner;
  with the observed runtime this executes no compiled test files and fails with
  `MODULE_NOT_FOUND`. The five compiled test files pass when named explicitly.
- `docker/build.sh` resolves `.env`, `Dockerfile`, the build context, and its
  GitHub authentication secret relative to the caller's current directory even
  though `README.md` documents a repository-root invocation.
- The Docker build defaults to `registry.pi.home:5000`, requires a local secret
  file, uses the mutable Git tag name as its source selector, and installs Node
  dependencies with `npm install`; meanwhile `package-lock.json` is ignored,
  absent from the expected-base Git tree, and inconsistent with the current
  package manifest, so neither CI nor the source archive can perform the
  approved locked installation.
- No current repository artifact selects `linux/arm64` and `linux/arm/v6`,
  authenticates to Forgejo, verifies package-owner privacy, or constrains image
  publication to `forgejo.alexlab.nl/alexlab`.

## Scope
- In scope:
  - Add GitHub Actions checks for pull requests targeting `main` and pushes to
    `main`, including merge commits delivered by pull-request merges.
  - Make the repository lint entry point non-mutating and retain an explicit
    local autofix entry point.
  - Make the repository test entry point execute all compiled tests
    deterministically and fail when compilation or any test fails.
  - Resolve the existing lint baseline violations required for the first CI run
    to be green without changing tested product behavior.
  - Remove the `package-lock.json` exclusion from `.gitignore`, regenerate or
    update the lockfile from the unchanged current `package.json`, and commit a
    consistent lockfile version 3 for `npm ci` and cache invalidation.
  - Add a Git-tag publication workflow for all pushed tags.
  - Build every image managed by this repository's `docker/build.sh` for exactly
    `linux/arm64` and `linux/arm/v6`, and push its release and rolling tags as
    multi-platform manifests only to `forgejo.alexlab.nl/alexlab`.
  - Add the minimum scoped `docker/build.sh`, `docker/Dockerfile`, Docker-context,
    and configuration changes needed for CI-safe paths, immutable event-source
    selection, lockfile-backed dependency installation, Buildx caching, secret
    handling, and registry overrides.
  - Preserve the documented local Docker build command and existing local
    default registry/tag behavior when CI overrides are absent.
  - Document triggers, checks, image names, tag mapping, secrets, token access,
    privacy prerequisites, runner assumptions, and local/CI build behavior.
- Out of scope:
  - Publishing to Docker Hub, GitHub Container Registry, the current
    `registry.pi.home:5000` target from CI, or any other registry.
  - Making the `alexlab` Forgejo organization private, creating the organization,
    creating credentials, or changing Forgejo server configuration.
  - Adding `linux/amd64`, `linux/arm/v7`, or any target platform other than
    `linux/arm64` and `linux/arm/v6`.
  - Adding architecture-specific image tag names or separate rolling aliases;
    both target variants share the existing release and rolling tags through a
    multi-platform manifest.
  - Changing application APIs, fan behavior, runtime configuration, or OpenAPI
    and `.http` contracts.
  - Replacing `build.sh` with a workflow-owned list of images.
  - Upgrading the application's Node or Alpine base versions.
  - Adding, removing, or intentionally upgrading direct dependency declarations
    in `package.json`; the lockfile correction records the dependency graph for
    the already-declared manifest.
  - Claiming bit-for-bit reproducible images across changes in upstream package
    repositories. Determinism here is limited to the event commit, tracked
    Docker inputs, lockfile, explicit base-version inputs, target platform, and
    declared build arguments.
  - Retagging or republishing historical Git tags that are not pushed after the
    workflow is present.

## Definitions
- Actual default branch: `main`, evidenced by the clean invoking checkout being
  on `main`, its upstream being `origin/main`, and the locally recorded
  `origin/HEAD` symbolic reference resolving to `origin/main`.
- Default-branch check: a GitHub Actions run that installs locked dependencies,
  runs non-mutating lint, and runs the complete compiled test suite.
- Committed lockfile: the tracked lockfile-version-3 `package-lock.json` whose
  root dependency and development-dependency declarations match the current
  `package.json`, which is not excluded by `.gitignore` and succeeds with
  `npm ci`.
- Pushed Git tag: a GitHub `push` event whose ref is under `refs/tags/`, with no
  restriction to stable-version tags.
- Event source revision: the immutable commit SHA carried by the tag-push event.
  It is distinct from the human-readable Git tag used in image tag names.
- Managed image: an image built and tagged by `docker/build.sh`. At the time of
  this spec there is one managed image family, `device-integration-api`, produced
  from `docker/Dockerfile` and the Docker inputs under `docker/`.
- Private Forgejo owner: the Forgejo organization `alexlab` with organization
  visibility reported as `private`. Forgejo package visibility follows package
  owner visibility rather than linked-repository visibility.
- Release image tag: the pushed Git tag followed by the existing Node base
  suffix, `${GIT_TAG}-node${BASE_IMAGE_VERSION}`.
- Rolling image tag: the existing moving alias
  `latest-node${BASE_IMAGE_VERSION}`.
- CI registry prefix: the exact non-secret constant
  `forgejo.alexlab.nl/alexlab`.
- CI target platform set: the ordered, exact Buildx platform value
  `linux/arm64,linux/arm/v6`.
- Published multi-platform image: one OCI image index or Docker manifest list at
  an approved tag, containing exactly one `linux/arm64` manifest and one
  `linux/arm/v6` manifest and no other runnable platform manifest.

## Confirmed Repository Baseline
- No `.github/` workflow tree exists.
- The expected-base Git tree does not contain `package-lock.json`, and
  `.gitignore` explicitly excludes it. An ignored local lockfile version 3 is
  present, but its root dependency set includes stale `pigpio-client` metadata
  that is absent from current `package.json`.
- The current scripts are:
  - lint: `eslint '{src,tests}/**/*.{js,ts}' --fix`;
  - test: `npm run build:test && node --test dist-tests/tests`;
  - test compilation: `tsc -p tsconfig.test.json`.
- The current lint baseline has exactly these observed violations:
  - unused `_speed` in `tests/fan/controllers/FanController.test.ts`;
  - a `let` that can be `const` in
    `tests/fan/infrastructures/FanTerminalGateway.test.ts`.
- The five compiled test files pass when explicitly selected, but the current
  `npm test` entry point does not select them.
- `docker/build.sh` currently manages one image name and gives the same image two
  tags:
  - `${DOCKER_REGISTRY_URI}/device-integration-api:${RELEASE_TAG}-node${BASE_IMAGE_VERSION}`;
  - `${DOCKER_REGISTRY_URI}/device-integration-api:latest-node${BASE_IMAGE_VERSION}`.
- The tracked local Docker defaults use base/build image version
  `19.2.0-alpine3.15`, registry `registry.pi.home:5000`, and the GitHub API source
  for this repository.

## Inputs And Constraints
- The default-branch filter is `main`, not the original request's `master`.
- CI checks use a declared Node 20 runtime and `npm ci` with the tracked
  `package-lock.json`; they must not depend on the runner's implicit Node/npm
  defaults.
- Implementation must remove the `package-lock.json` ignore rule and produce a
  tracked lockfile version 3 consistent with the unchanged current
  `package.json`. It must not force-add the stale ignored file unchanged or
  alter direct dependency declarations to match stale lockfile metadata.
- The lint command used by CI must not edit files. The local autofix capability
  remains available under a separately named npm script.
- The test command must discover all compiled `*.test.js` files below
  `dist-tests/tests`, including future bounded-context subdirectories, and must
  not succeed merely because zero tests were selected.
- Pull-request checks must not read or require Forgejo secrets, so checks remain
  usable for untrusted and fork-origin pull requests.
- The tag trigger must cover every tag ref, including tag names containing path
  separators. Image publication still requires the resulting release image tag
  to satisfy the Docker/OCI tag grammar. Invalid image-tag input must fail before
  registry login or upload with a clear error; it must not be silently rewritten
  into a potentially colliding image tag.
- The publication workflow must use the event commit SHA as the Docker source
  revision and the Git tag name only for image tag mapping.
- The publication build must pass `linux/arm64,linux/arm/v6` explicitly to one
  Buildx invocation. Runner host architecture must not implicitly determine the
  output platforms.
- Registry authentication uses GitHub repository secrets named exactly:
  - `FORGEJO_REGISTRY_USERNAME`;
  - `FORGEJO_REGISTRY_TOKEN`.
- `FORGEJO_REGISTRY_TOKEN` is a Forgejo access token, not a plaintext account
  password. Its account must have write access to packages owned by `alexlab`,
  and the token must have `write:package` and `read:organization` access while
  avoiding unrelated scopes.
- GitHub source-archive authentication uses the workflow-provided
  `GITHUB_TOKEN`; no separately managed GitHub token secret is required.
- GitHub workflow token permissions are limited to `contents: read`. Publishing
  to external Forgejo must not receive GitHub `packages: write` permission.
- Registry login must send the Forgejo token through standard input or an
  equivalently non-logging action input. Secrets must not appear in command
  arguments, generated image layers, the ordinary Docker build context, cache
  keys, or logs.
- Before any image upload, the tag workflow must query authenticated Forgejo
  organization metadata and prove that owner `alexlab` exists and has private
  visibility. Missing, inaccessible, or non-private organization metadata is a
  hard failure before publication.
- All publication output tags must begin with the exact prefix
  `forgejo.alexlab.nl/alexlab/`. CI must fail closed if the resolved output
  registry or owner differs.
- The tag workflow may pull base images and actions from their configured public
  upstreams, but it must not push any image or cache manifest to another
  container registry.
- The existing `./docker/build.sh --release <RELEASE_TAG>` command must work from
  the repository root. Existing `--debug`, `--platform`, `--push`, `--force`,
  and `--release` behavior remains available for local builds.
- Without explicit CI overrides, the local build retains the tracked
  `registry.pi.home:5000` default and the existing two-tag mapping. CI-specific
  registry, source revision, secret path, platform, push, and cache inputs must
  be additive overrides rather than edits developers must make to tracked local
  configuration.
- Docker source installation uses `npm ci` against the source revision's
  lockfile. A missing or inconsistent lockfile is a failed image build.
- Docker secrets are mounted as BuildKit secrets and excluded from the ordinary
  Docker context.
- GitHub Actions and Docker actions must be pinned to immutable commit SHAs,
  with readable version comments, rather than floating major-version tags.
- The npm download cache is keyed through the tracked lockfile. Docker layer
  caching uses the GitHub Actions Buildx cache with a repository/image/platform-
  set scope that distinguishes the exact ARM64/ARMv6 build. Cache misses or
  cache-service failures must permit a clean rebuild and must never change image
  naming or publication targets.

## Deterministic Behavior
1. Pull request checks
- Opening, reopening, or updating a pull request whose base branch is `main`
  starts the default-branch check.
- Pull requests targeting any other branch do not start this check under this
  spec.
- The job checks out the event revision, installs dependencies with `npm ci`,
  runs the non-mutating `npm run lint`, and runs `npm test`.
- A dependency installation, lint, compilation, missing-test-selection, or test
  failure fails the job.
- The job does not authenticate to Forgejo and does not build or push images.

2. Default branch checks
- Every push to `main`, whether direct or created by a pull-request merge,
  starts the same default-branch check.
- A push to another branch does not start this check under this spec.
- A tag-only push does not cause the branch-filtered check merely because the
  tag points to a commit on `main`.

3. Tag publication preflight
- Every pushed Git tag starts the publication workflow.
- Before registry login or upload, the workflow validates required secrets,
  validates the release image tag, verifies that the event source revision is
  available, verifies Buildx support for both `linux/arm64` and `linux/arm/v6`,
  verifies trusted HTTPS reachability of `forgejo.alexlab.nl`, proves `alexlab`
  is private through authenticated Forgejo metadata, and verifies the resolved
  registry prefix is exact.
- Any failed or unavailable preflight condition fails the workflow without an
  image push.

4. ARM64 and ARMv6 multi-platform image build and publication
- The workflow invokes repository `docker/build.sh` as the sole image
  enumeration and build entry point with:
  - source revision equal to the event commit SHA;
  - release tag equal to the pushed Git tag name;
  - platforms exactly `linux/arm64,linux/arm/v6` in one Buildx invocation;
  - registry prefix exactly `forgejo.alexlab.nl/alexlab`;
  - push enabled;
  - GitHub Actions Buildx cache enabled.
- For the current single managed image and base version, a pushed tag such as
  `1.2.3` publishes exactly:
  - `forgejo.alexlab.nl/alexlab/device-integration-api:1.2.3-node19.2.0-alpine3.15`;
  - `forgejo.alexlab.nl/alexlab/device-integration-api:latest-node19.2.0-alpine3.15`.
- Both tags resolve to a multi-platform image whose runnable variants are
  exactly `linux/arm64` and `linux/arm/v6`, built from the same source revision
  and Docker inputs in that workflow run.
- The workflow does not publish a bare `1.2.3`, bare `latest`, `linux/amd64`,
  `linux/arm/v7`, a single-platform replacement, or architecture-specific tag.
- If `build.sh` manages multiple images in the future, a tag run continues to
  invoke it once as the build authority; every image it declares must receive
  the equivalent release/rolling mapping and target/platform guard. The
  workflow must not contain a second, partial image inventory.
- A build or push failure fails the workflow and must not be reported as a
  successful release. Registry-side partial state, if an external failure occurs
  after one manifest is accepted, must be reported rather than treated as an
  atomic success.

5. Local Docker build compatibility
- The documented repository-root command resolves all tracked Docker inputs
  relative to `docker/build.sh`, independent of the caller's current directory.
- A local invocation without CI overrides continues to source the tracked local
  defaults, use the release value as its source ref, create the existing release
  and rolling tags under `registry.pi.home:5000`, and avoid pushing unless
  `--push` is supplied.
- Local callers may continue to select another platform or registry explicitly;
  the exact Forgejo target guard applies to the GitHub publication workflow, not
  to ordinary local builds.

## Approval Assumptions And Recommendations
- **Recommendation - default branch:** approve `main` as the workflow branch
  filter. This is confirmed from local Git metadata but was not live-revalidated
  against GitHub during research.
- **Recommendation - registry namespace:** approve the exact owner-qualified
  image prefix `forgejo.alexlab.nl/alexlab`. The live registry and organization
  were not queried during repository research.
- **Blocking publication assumption - privacy:** `alexlab` exists in Forgejo and
  is private. Because Forgejo package visibility follows owner visibility, the
  workflow must fail before upload unless this is proven live.
- **Recommendation - credentials:** configure
  `FORGEJO_REGISTRY_USERNAME` and `FORGEJO_REGISTRY_TOKEN` as repository secrets,
  with the token limited to package write and organization read access and the
  account holding package-write access in `alexlab`.
- **Recommendation - runner:** use a GitHub-hosted Linux runner with pinned
  Buildx/QEMU setup actions. It is assumed that the runner can reach
  `forgejo.alexlab.nl` on HTTPS with a publicly trusted certificate chain and
  that the GitHub Actions cache service is available. A private-network-only or
  privately rooted registry would require an explicitly approved self-hosted
  runner design instead.
- **Recommendation - Node checks:** use declared Node 20 for lint and tests,
  matching the repository's Node 20 type declarations while remaining above the
  documented Node 19 minimum. The Docker runtime base upgrade remains out of
  scope.
- **Recommendation - tag mapping:** preserve both current suffix-bearing tags,
  including the moving `latest-node${BASE_IMAGE_VERSION}` alias. Approving this
  spec confirms that prerelease tags may also advance that rolling alias, as the
  current `build.sh` behavior does.
- **Assumption - release tag syntax:** normal release tags are valid Docker/OCI
  tags, as the observed `1.2.2` and `1.2.0-beta3` tags are. Other tag events are
  handled by failing safely before upload rather than silently renaming them.
- **Recommendation - platform representation:** publish the approved release and
  rolling names as multi-platform manifests containing both variants. This
  preserves the current tag mapping and lets a conforming client select the
  matching variant without introducing architecture-specific tag names.
- **Confirmed base-manifest input:** Docker Hub metadata for the pinned
  `node:19.2.0-alpine3.15` and `alpine:3.15` tags listed `linux/arm/v6` and
  `linux/arm64` variants during this iteration's research.
- **Assumption - ARM build inputs:** every install and execution step used by the
  current Dockerfile, including Alpine packages, locked npm dependencies, and
  `pigpio` installation, works for both target platforms. The workflow must
  prove this by completing both builds; it must not fall back to amd64 or omit a
  failed target variant.

## Impact And Regression Considerations
- Existing application and API behavior is unchanged.
- Dependency declarations remain unchanged. Tracking the corrected lockfile
  freezes the resolved dependency graph that was previously omitted from Git;
  the generated lockfile diff must therefore be reviewed and `npm ci` must
  prove manifest consistency before delivery.
- The lint script changes from edit-in-place behavior to check behavior;
  developers retain an explicit autofix command and README documentation.
- The test command becomes stricter because it must execute real compiled tests
  and reject an empty selection.
- Correcting the two current lint violations is test-only cleanup and must not
  change assertions or product behavior.
- The Dockerfile continues to build the source revision through the current
  downloader/builder/runtime shape, but uses the event SHA in CI and locked npm
  installation.
- Local image names, Node suffixes, default registry, options, and push opt-in
  remain compatible.
- CI release and rolling references change from single-platform ARM64 manifests
  to manifest indexes containing ARM64 and ARMv6. Ordinary ARM64 pulls retain a
  matching variant, but the top-level digest changes and digest-pinned consumers
  must deliberately adopt the new index digest.
- ARMv6 emulation can make the publication build slower and exposes previously
  untested architecture-specific failures in Alpine packages, npm dependencies,
  and runtime installation.
- The CI registry override must not leak into tracked local defaults.
- No OpenAPI or `.http` update is required because no HTTP contract changes.
- A tag publication remains DRAFT operationally until a real tag run proves
  hosted-runner reachability, Forgejo privacy, authentication, both ARM outputs,
  the exact two-platform manifest, and exclusive target publication.

## Validation Plan
- Repository checks:
  - verify `package-lock.json` is tracked, uses lockfile version 3, is not
    ignored, and its root dependency declarations match `package.json`;
  - install from the lockfile with `npm ci` in a clean dependency state;
  - run `npm run lint` and confirm it changes no tracked file;
  - run the local autofix script separately only in a disposable validation
    copy or after confirming no expected diff;
  - run `npm test` and confirm all five current compiled test files execute;
  - run `npm run build`;
  - run `git diff --check`.
- Workflow checks:
  - validate workflow YAML and action expressions with an Actions-aware static
    validator;
  - prove the configured events include pull requests to `main`, pushes to
    `main`, and all pushed tag refs, without branch/tag overlap errors;
  - confirm workflow and job permissions are `contents: read` only;
  - confirm the pull-request job has no Forgejo secret or publishing dependency;
  - confirm all external actions are commit-SHA pinned.
- Build-script and Docker checks:
  - run `bash -n docker/build.sh` and a shell linter when available;
  - use deterministic command-level tests or a fake Docker executable to verify
    argument parsing, repository-root path resolution, local defaults, CI
    overrides, two-tag mapping, exact ordered multi-platform propagation, source
    SHA separation, cache propagation, secret paths, and fail-closed
    registry/tag/platform validation;
  - confirm secret files are excluded from the ordinary Docker context;
  - confirm the Docker build uses `npm ci` and fails on lockfile mismatch.
- Live GitHub/Forgejo validation:
  - observe a pull-request check targeting `main` and a push check on `main`;
  - push a disposable valid tag only when authorized, observe the privacy
    preflight and successful authenticated publication, then inspect both
    manifests at `forgejo.alexlab.nl/alexlab/device-integration-api`;
  - verify each published image index contains exactly `linux/arm64` and
    `linux/arm/v6`, with neither duplicate nor extra runnable variants;
  - pull and smoke-test the matching image variant on ARM64 and ARMv6 hardware,
    or explicitly report either unavailable platform runtime validation;
  - verify unauthenticated clients cannot pull the published image;
  - verify no corresponding image was pushed to Docker Hub, GHCR,
    `registry.pi.home:5000`, or another namespace;
  - if live tag publication or anonymous-access validation is not performed,
    report the delivery as DRAFT rather than claiming private registry delivery.
- Docker validation must explicitly select and verify the workspace-required
  Docker context before any local Docker command.

## Documentation Requirements
- Add the approved spec to `AGENTS.md` current active specs after approval.
- Update `README.md` to document:
  - the committed lockfile and locked `npm ci` installation used by CI and the
    Docker source build;
  - the `main` pull-request and push checks;
  - the non-mutating lint and explicit lint-autofix commands;
  - the corrected test entry point;
  - all-tag ARM64 and ARMv6 multi-platform publication behavior;
  - exact Forgejo image names and release/rolling tag mapping;
  - required GitHub repository secret names and Forgejo token access;
  - the private-organization prerequisite and fail-closed privacy check;
  - GitHub-hosted runner, HTTPS, QEMU, ARM64, and ARMv6 assumptions;
  - preserved local build command, defaults, optional platform, and push
    behavior.
- Do not update OpenAPI or controller `.http` files.

## Acceptance Criteria
- A pull request targeting `main` runs locked dependency installation,
  non-mutating lint, and the complete test suite.
- `package-lock.json` is tracked, is no longer ignored, uses lockfile version 3,
  matches current `package.json`, and supports a successful clean `npm ci`.
- Every push to `main`, including a merged pull request, runs the same checks.
- Pull requests and pushes for other branches do not run the default-branch
  check under this spec.
- `npm run lint` does not edit files, the two observed baseline violations are
  resolved, and an explicit local autofix command remains available.
- `npm test` executes all five current test files and cannot pass because no
  tests were selected.
- Every valid pushed Git tag starts one publication for exactly
  `linux/arm64,linux/arm/v6` using the event commit SHA as source.
- The current managed image is published only as the exact owner-qualified
  release and rolling tags defined above.
- Publication stops before upload if secrets are absent, tag mapping is invalid,
  either required platform is unavailable, HTTPS is untrusted/unreachable, the
  registry prefix differs, or `alexlab` is absent, inaccessible, or non-private.
- GitHub token permissions are read-only and Forgejo credentials are not exposed
  to pull-request checks, build layers, build context, caches, or logs.
- Dependency and Buildx caching is enabled without changing correctness on a
  cache miss.
- The documented root-level local build command works and retains its existing
  default registry, image tags, options, and no-push default.
- No application, API, OpenAPI, or `.http` behavior changes.
- Static validation, lint, tests, build, and Docker-script tests pass.
- Live GitHub/Forgejo/ARM64/ARMv6/private-access validation passes before
  delivery is called final; otherwise the remaining operational gap is
  explicitly DRAFT.
