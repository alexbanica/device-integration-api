# Backyard shade API implementation plan

Status: Approved
Date: 2026-11-01
Specification: `specs/SPEC-backyard-shade-api.md`, approved original plus approved A1.

## 1. Entry, scope and delivery

Implement only the approved effective specification. Planning makes no source
changes and grants no implementation, actuation or publication authority.
Baseline inspected: `0b94aeb4f882de8ae25b9e5db4180c01d14255ee` on clean `main`
apart from these planning artifacts. Preserve all unrelated work and the invoking
checkout's branch. No transceiver repository edits are authorized.

Delivery branch: `feature/backyard-shade-api` on `origin` (GitHub
`alexbanica/device-integration-api`). Isolated implementation location:
`/tmp/agent-worktrees/device-integration-api/backyard-shade-api`.
At implement entry refresh remote refs: resume the remote delivery branch if it
exists, otherwise use refreshed `origin/main`, falling back to `origin/master`
only when main is unavailable. Record resolved ref/SHA before edits. Incompatible
baseline drift, failed fetch, conflicting local branch or unsafe worktree state
stops DRAFT rather than resets anything.

Parent records invoking HEAD/index/content recovery state, transfers exact
approved artifacts with SHA-256 verification, and uses a clean detached worktree
for a new branch. Immediately before its first commit verify the branch is absent
locally and unattached, then create it at verified detached HEAD. If a registered
temporary path is absent, remove only that registration non-forcibly and verify
before recreating; other collisions stop. Existing checkpoint resumes verify
ancestry, exclusive attachment and fast-forward-only state. Never reset to main.

After valid implement entry, parent commits accepted source and both artifacts,
pushes non-forcibly to `origin/feature/backyard-shade-api`, verifies remote SHA,
tracking branch and accepted file content. Create or update a PR against main;
keep it DRAFT while required package/image/hardware/CI evidence is blocked.
No merge, release tag, registry push, deployment or live actuation is authorized.
After verified push detach the retained clean worktree and restore only unchanged
transferred invoking artifacts, preserving independent edits. Verify invoking
checkout recovery; incomplete recovery is DRAFT. Partial checkpoints are progress,
not completion, and require no routine continuation question.

## 2. Implementation decisions and evidence boundary

Follow fan's configuration -> controller/service interface -> gateway -> terminal
port pattern. Add `src/shades` and wire `register_shades_module` at composition.
Keep fan source and its legacy tests unchanged. No new domain algorithm is
needed; new behavior is configuration, orchestration and adapters, so new
automated tests are inapplicable under the domain-only policy.

Use `SHADE_ENABLED`, `SHADE_SCRIPT_DIR`, `SHADE_BASH_UP`, `SHADE_BASH_DOWN`,
`SHADE_BASH_MY` exactly as specified. Require whitespace-nonempty command/directory
values when enabled; only exact `true`/`false` enablement values are valid, with
absent disabled. Select trusted full commands in configuration; never consume
request body/query/path values as shell fragments.

Add a shade-specific process adapter implementing `TerminalExecutorInterface`,
instead of changing `LocalMachineTerminal` used by fan. Execute configured shell
commands in a dedicated process group on the Linux target, with a five-second
timer. On timeout send SIGTERM to the group, allow 250 ms grace, then send
SIGKILL. Allow a further 750 ms to confirm direct-child close and group absence
using `process.kill(-pgid, 0)` (only ESRCH proves absence; EPERM is uncertainty).
Bound the request response to six seconds plus event-loop scheduling overhead.
On early child close still check group absence and clean up surviving descendants
before releasing ownership. If close/group absence cannot be confirmed, latch
the shade integration busy until process restart; return 500 for the failed
request at the deadline and reject subsequent calls with 409.
Do not permit detached/daemonizing deployment commands. Inspect group cleanup
with harmless child processes; Pi checks must additionally qualify actual CLI
behavior. This preserves the specified bounded attempt and prevents a fresh send
after an uncertain timeout. Parent checks that implementation does not strand
HTTP requests indefinitely on abnormal child shutdown.

The service acquires a synchronous in-process busy flag before its first await;
concurrent requests fail immediately without a queue. Hold ownership through
terminal cleanup. Successful calls return empty 202; busy returns 409; execution
failure/timeout returns 500. Use typed internal errors and fixed public messages
with shared ErrorResponse. Unexpected failures also use a fixed 500 message.
No retries, wake-up logic, position state, profile repair or command suppression.

Add `ShadeTerminalExecutorInterface` extending the shared terminal port with
`isQuarantined(): boolean`. The shade adapter sets permanent quarantine before
settling any uncertain-cleanup execution. The gateway returns `ShadeExecutionResultDto`
with `successful` and `safeToContinue`; the service clears busy only when
`safeToContinue` is true. Unexpected exceptions conservatively latch busy. This
keeps process details out of the service and leaves the shared fan contract intact.

Packaging evidence is already researched from transceiver
`feature/cc1101-connection-test` at `0b589c70b4c5dadbe97b8a6673c7a1bb282e7266`:
`pyproject.toml` defines `cc1101-transceiver` entry point, CLI parser defines
`emitter send --profile <path> --command up|down|my`. Use those commands in examples.
Do not infer CLI naming from the eventual distribution name. No broad research:
only these named patterns, direct dependency build metadata and credible
regressions; materially incompatible final package requires amendment.

After the user's merge notification, GitHub connector evidence confirmed remote
`main` at `f478c295ad376fa6c8b44c4475d1e30e95b4a565`. Its packaging entry point,
CLI parser, Python floor and declared dependencies match the original research.
Use this merged commit as the current package contract reference. Local main was
stale and shell DNS failed; remote evidence came from SHA-pinned connector reads,
not local refs. Subsequent Forgejo release inspection verified the published
name/version and installed CLI metadata described in §4; the temporary placeholder
prerequisite is now resolved without changing the approved API behavior.

## 3. Units, ownership and sequencing

All children preserve others' edits and never branch, commit, push, create
worktrees, publish or actuate. Parent dispatches fresh bounded roles with artifact
digests, precise ownership and one-JSON-object handoff (`unit_id`, `status`,
applicable evidence/findings/changes/validation/blockers). Aim three minutes,
interrupt at five minutes, preserve partial evidence and split disjoint successors.
At most three child slots; queue rather than overlap ownership. Main serializes
integration, shared artifacts and repository-wide checks.

| Unit | Owner and exact paths | Prerequisites | Completion and validation |
| --- | --- | --- | --- |
| S1 command integration | Developer: `src/shades/shades.ts`; `configurations/ShadeConfiguration.ts`, `ShadeConfigurationError.ts`; `controllers/ShadeController.ts`; `services/ShadeServiceInterface.ts`, `ShadeService.ts`, `ShadeBusyError.ts`, `ShadeCommandError.ts`; `infrastructures/ShadeTerminalGatewayInterface.ts`, `ShadeTerminalGateway.ts`, `ShadeProcessTerminal.ts`, `ShadeTerminalExecutorInterface.ts`; `dtos/ShadeExecutionResultDto.ts` beneath `src/shades`; `src/device_integration_api.ts` | Approved pair, prepared baseline | Enablement, three exact routes, errors, exclusive bounded execution, inward dependency direction; TypeScript build and structural inspection; non-RF operator smoke checks in §5. |
| S2 package integration | Developer: `docker/Dockerfile`, `docker/build.sh`, `docker/.env` only if tracked | Approved pair, package evidence; may run alongside S1 | Docker arguments/install/verification and build-script forwarding in §4; shell syntax and build command inspection; placeholder rejection; available image checks. |
| S3 public contract and documentation | Parent owns initial `openapi/device-integration-api.openapi.yaml` endpoint changes; documentation-writer owns final README.md, AGENTS.md, `http/ShadeControlAPI.http`, and additions to tracked `.env.example` only if such a template exists | S1/S2 integrated semantics; writer runs once after final QA | Exact route/status/error documentation and executable request examples; OpenAPI structural validation and cross-check against controller; no credentials or operational profile committed. |
| S4 assurance and delivery | Parent coordinates read-only code-reviewer, contract-reviewer, security-reviewer, then qa-agent, then S3 writer; parent alone owns SPEC/PLAN approval records, evidence and Git | Integrated S1/S2 and initial OpenAPI | Full assurance §6; documentation consistency; staged diff review and branch push/PR verification; explicit complete versus blocked DRAFT assessment. |

Paths not enumerated are outside ownership. A required new path needs parent
reconciliation; a behavior change requires the applicable amendment process.
No request DTO is needed for bodyless endpoints; controller responses reuse
shared ErrorResponse, as existing fan commands do.

## 4. Docker package integration

Add `SHADE_PACKAGE_NAME=rpi-cc1101-transciever` and
`SHADE_PACKAGE_VERSION=1.0.0b2` Docker build arguments, pinned to the user-supplied
and verified Forgejo release. A1 permitted placeholders while these values were
unknown; use these actual values now.
Reject empty/placeholder values with a clear build error before package work.
Validate a distribution identifier and an exact release version; reject URLs,
VCS refs, requirement expressions, options and shell metacharacters. Pass them
as quoted arguments, never eval. Forward optional same-named environment values
through `docker/build.sh` with the existing array-based Buildx invocation, so
operators can supply values without modifying the script. Default builds use
the verified release; future overrides require the same metadata/compatibility
checks. Reject placeholders as invalid overrides rather than silently skipping
the package install.

Keep Forgejo and public PyPI dependency indexes specified by A1. Preserve
IR emitter installation and both supported target platforms. Require Python
>=3.10 explicitly. Keep the existing `node:19.2.0-alpine3.15` bases; their system
Python 3.9 cannot satisfy the package requirement. Build CPython 3.11.18 from
`https://www.python.org/ftp/python/3.11.18/Python-3.11.18.tar.xz`, verifying SHA-256
`9120e0a653868f6e3698d36cdd99e5a58903ec9469e448f21d98f7b16d8fa290`
before extraction. Install to `/opt/python`, put `/opt/python/bin` first on PATH,
and use that interpreter for pip, the existing IR emitter and the new shade
package. Do not mix system-Python site packages with this interpreter. Bootstrap
pip using CPython ensurepip, then apply the existing pinned pip upgrade.

Use Alpine source-build prerequisites `build-base`, `linux-headers`, `pkgconf`,
`openssl-dev`, `zlib-dev`, `bzip2-dev`, `xz-dev`, `readline-dev`, `sqlite-dev`,
`libffi-dev`, `gdbm-dev`, `ncurses-dev`, `expat-dev` and `swig`. Build in the
runtime stage before switching to node, with no CPU-specific optimization flags;
install Python/native package dependencies while tools are available. Retain
required runtime libraries by resolving installed ELF dependencies with scanelf
and installing their Alpine providers before removing the virtual build-tool
group and source archive. Check interpreter version, ssl, ctypes, sqlite3 and
dependency imports after tool removal. Actual native requirements and ARMv6
compilation remain build evidence requirements, not proven compatibility. If this
selected source build fails, report the precise blocker rather than silently
upgrading the base or removing a target platform.

Verified release: `rpi-cc1101-transciever==1.0.0b2`, Python >=3.10, wheel
`rpi_cc1101_transciever-1.0.0b2-py3-none-any.whl`, SHA-256
`4772ee209da3f9125be33c355df77589ff48bef176f9efb4b64ffe0a30c210c6`.
Unauthenticated release page, package-specific simple index and artifact download
returned HTTP 200. The index root returned 404, but the project-specific PEP 503
endpoint works; root listing is not an installation prerequisite. Inspect wheel
metadata and verify its advertised hash before installation. The wheel is platform
independent; its native dependencies still require per-platform qualification.

Follow the merged package README's separate-index installation sequence: install
`cc1101==3.0.0`, `rpi-lgpio` and `spidev` with their transitive dependencies from
public PyPI, then install the exact shade name/version from Forgejo alone with
`--no-deps`. This is an accompanied dependency install, permitted by SPEC §6;
do not use unordered extra-index resolution for the shade distribution. Run
`python3 -m pip check` and verify the final distribution's metadata requirements
are satisfied. New final-release requirements must be installed with equivalent
provenance or treated as incompatibility, never ignored. Preserve the existing
IR-emitter install behavior. In the final runtime environment, as `node`, verify
`import cc1101_transceiver, cc1101, spidev, RPi.GPIO, lgpio`, the installed
distribution/version via `importlib.metadata`, and
`cc1101-transceiver --help` plus `cc1101-transceiver emitter send --help`.
These must not access hardware. Check the selected release import contract;
incompatible changes are blockers. Package build and import errors fail builds.
Do not use dummy packages to claim dependency qualification.

Do not change default user or grant blanket privileged access. Document
operator-provided SPI/GPIO mappings and supplemental device groups, the writable
profile directory and one owning process. Avoid automatic recursive ownership
changes to operator profiles. Real directory permissions are qualified on Pi.

## 5. Validation and terminal evidence

Parent serially runs `npm ci`, `npm run build`, `npm run lint`, `npm test`,
`bash -n docker/build.sh`, `sh -n docker/docker-entrypoint.sh`, and
`git diff --check`. Existing tests may run but must not be edited outside domain
logic. Record environmental/pre-existing failures without masking them.

Run controlled manual HTTP smoke checks on a temporary local process using
harmless commands and disposable directories: missing/false enablement leaves
shade routes unregistered and health/fan unchanged; invalid enablement or missing
required values fails startup; each route sends its one command; 202 is empty;
nonzero and nonexistent executable produce sanitized 500; a slow command makes
concurrent calls return 409; timeout terminates its harmless descendant and never
retries. Include a SIGTERM-resistant child with redirected stdio, an early-exiting
shell with a surviving same-group child, and a controlled uncertain-cleanup path
that returns bounded 500 followed by persistent 409. Commands that deliberately
escape the process group are unsupported; inspect the configured CLI for that
behavior and block qualification if it daemonizes. Keep the manual check sequence in evidence, not a new automated test
file. Use harmless fan command configuration and a disposable fan-state file.
No real profile, device or original remote may be touched.

Validate OpenAPI syntax/structure with an available non-mutating parser and
inspect exact paths/statuses/schema references against controller/example files.
Check documentation contains no unsupported physical success claims.

Confirm an explicit placeholder override fails with the intended diagnostic
when Docker is available. This is guard evidence only. Using the verified
`rpi-cc1101-transciever==1.0.0b2` default, use Buildx local OCI output without
`--push` for `linux/arm64,linux/arm/v6`; execute final-image
import/help/dependency/version checks separately for each runnable architecture
(native or qualified emulation). Missing builder/emulation/package availability
is missing evidence, not a source-test failure. Preserve fan emitter import/CLI
checks and build platform configuration. Never publish to obtain build evidence.

Live Pi qualification requires separately authorized target access and physical
actuation: SPI/GPIO permission and setup, profile sibling-write/rename permissions
without altering production rolling code, persistence across container replacement,
command duration, no competing process, and observed up=close/down=open/my=stop.
Coordinate any real sends before execution. Without authority/capability keep
these criteria pending and delivery DRAFT; safe source work and assurance continue.

## 6. Assurance and recovery

Profile: full, because public HTTP contracts, executable configuration, native
dependencies, container packaging, hardware operations and supply chain change.
Independent integrated code review, contract review and security review are all
required. Reviewers get baseline/current diff, complete effective artifacts and
digests, trace links, actual check results and known blockers; each covers the
whole assigned integrated boundary, including cross-component failure behavior.
Security review covers trusted-shell boundary, termination, registry provenance,
build argument validation and runtime device permissions. Contract review covers
routes, errors, busy semantics, installed CLI and fan compatibility.

Wait for the entire wave, dispose every supported finding, apply one consolidated
in-scope correction batch through bounded developers, then rerun affected checks.
Run final independent qa-agent checks with the domain-only policy and permitted
non-RF effects. Repeat the full cycle only for confirmed acceptance/check failure,
regression, incompatibility, high/critical security finding or blocked requested
behavior where benefit exceeds impact. Invoke documentation-writer once after
final QA, then parent reconciles docs and final diff. No review grants approval.

Complete means all approved criteria, assurance, documentation, exact-head checks,
verified branch push and PR delivery are satisfied, including real package/image
and authorized hardware evidence unless explicitly excluded by the user later.
Package identity and download availability are resolved; actual dependency
installation and image/runtime qualification remain required evidence.
When external package, hardware, network, CI, architecture build or permission
blocks remain, finish all independent work and safe authorized branch delivery as
blocked DRAFT with exact unmet criteria. Do not merge or label complete. Git writes
may require sandbox approval; inability to obtain it blocks delivery only, not
safe remaining preparation. Preserve invoking changes and recovery information.

## 7. Requirement-to-delivery trace

| SPEC anchor | Delivery | Validation / evidence |
| --- | --- | --- |
| §§1–2 scope and preservation | S1, S3; no changes to fan/health behavior or transceiver source | Diff boundaries, existing checks, harmless fan/health smoke |
| §3 definitions, CLI and rolling-code ownership; A1 CLI provenance | S1, S2, S3 | Repository entry-point/parser evidence, final release help, no profile-writing API code |
| §4 three mappings, bodyless calls, 202/409/500, no retries/queue/state/wake-up | S1, S3 | Structural route inspection and non-RF HTTP smoke; contract review |
| §5 layering, enablement and required environment | S1 | Imports/build, enablement/startup smoke, architecture assessment |
| §5 trusted shell, five-second bound, exclusivity and uncertain failures | S1, S3 | Child-group timeout/busy smoke, security review, live CLI duration pending |
| §6 exact dependency installation; A1 name/version placeholders/index | S2 | Verified 1.0.0b2 metadata/download, build argument/forwarding review, placeholder override guard, pinned install and pip check |
| §6 Python >=3.10, runtime user, both ARM platforms and IR preservation | S2 | Image build and import/help/version checks per platform; not established by wheel download |
| §6 persistent profile/devices and no automatic provisioning/repair | S1, S3; no profile or host mutation | Configuration inspection, deployment docs, authorized Pi persistence/device evidence pending |
| §7 build/lint/tests and domain-only boundary | S4 | Exact-head command results, no non-domain test additions |
| §7 local/image/live evidence separation and physical mapping | S4 | Recorded results/skips; pending hardware keeps DRAFT |
| §8 OpenAPI, HTTP, README and AGENTS; no event docs | S3 | Structural contract validation, docs reconciliation |
| A1 original scope retained, source preparation versus completion | S2, S4 | User supplied real package 1.0.0b2; image proof still required; explicit DRAFT disposition for unmet checks |

## 8. Plan assurance

Explorer `shade-plan-explorer` inspected the approved effective SPEC and initial
PLAN (SHA-256 `4820fe479048d91cdf273955b4fc8dd14381569f54f1263555610e14e8c958d2`),
API module/source/build/workflow paths and package source. Supported findings:
Python floor incompatibility and incomplete descendant-cleanup confirmation.
Disposition: §4 now selects checksum-verified source-built CPython; §2 defines
group-absence checks and quarantine. CLI provenance was confirmed, not assumed.

Architect `shade-plan-architect` independently checked architecture, contracts,
ownership, sequencing, packaging and recovery on that revision. It required
explicit termination deadlines and a cross-layer termination-confidence signal.
Follow-up `shade-plan-corrections` reviewed revised PLAN
`90b39f1d6d4514ae3e2114b251ab925da35f458e855a4fde4e6bc68c8685b24a`, confirmed
the timeout/Python corrections coherent, and identified two omitted ownership
paths. Both are now enumerated in S1. Other prior coverage remains applicable.

Explorer follow-ups `shade-python-build-evidence` and
`shade-remote-main-evidence` supplied official CPython release/checksum/build
references and SHA-pinned GitHub main metadata. The latter identified separate
package/dependency index selection in the merged README; §4 now follows it while
retaining complete dependency installation and pip check. These are plan
corrections within the effective SPEC, not new product behavior. Parent verified
handoff identities/status, artifact hashes, required coverage and dispositions.
No actionable supported finding remains unresolved. None of these reviews
proves source compilation, published-package availability or hardware success.

Evidence links: [CPython 3.11.18 release](https://www.python.org/downloads/release/python-31118/),
[source archive/checksum listing](https://www.python.org/ftp/python/3.11.18/),
[CPython build dependencies](https://devguide.python.org/contrib/workflows/install-git/),
[Alpine 3.15 Python metadata](https://pkgs.alpinelinux.org/package/v3.15/main/x86/python3-dev),
[merged package source](https://github.com/alexbanica/rpi-cc1101-transciever/tree/f478c295ad376fa6c8b44c4475d1e30e95b4a565).


### Published package evidence and approval

Explorer `forgejo-shade-package-access` successfully retrieved the user-provided
release page, project-specific simple index, wheel and sdist without credentials.
Static wheel METADATA confirms the exact name/version, Python floor and three
requirements in §4; entry_points.txt confirms
`cc1101-transceiver = cc1101_transceiver.controllers.cli:main`. Static parser
inspection confirms the required send arguments. Parent independently read wheel
metadata/entry point and calculated the wheel SHA-256 matching the simple index.
This carries forward prior plan assurance because command contracts/dependencies
match the previously reviewed repository evidence. No installation, dependency
resolution, Docker build or hardware actuation was performed during planning.

- Release: https://forgejo.alexlab.nl/public/-/packages/pypi/rpi-cc1101-transciever/1.0.0b2
- Project index: https://forgejo.alexlab.nl/api/packages/public/pypi/simple/rpi-cc1101-transciever/
- Wheel: https://forgejo.alexlab.nl/api/packages/public/pypi/files/rpi-cc1101-transciever/1.0.0b2/rpi_cc1101_transciever-1.0.0b2-py3-none-any.whl

Exact installation sequence (dependency resolution completes before project
installation with --no-deps):

```sh
python3 -m pip install --index-url https://pypi.org/simple/ \
  cc1101==3.0.0 rpi-lgpio spidev
python3 -m pip install --no-deps \
  --index-url https://forgejo.alexlab.nl/api/packages/public/pypi/simple/ \
  rpi-cc1101-transciever==1.0.0b2
python3 -m pip check
```

Approval record: On 2026-11-01 the user instructed “approve plan if you updated
the details for the package”. The parent fulfilled that condition by recording
the verified release, actual build-argument defaults, dependency/index install
sequence, CLI, hash and remaining validation boundaries above. This conditional
approval covers the complete plan with those package-detail updates. All other
plan decisions and the approved effective SPEC remain unchanged. Implementation
still requires explicit implement entry in a new session, cleared context, or
explicit same-context consent; this approval is not implementation execution.

## Amendment 1 — 2026-11-13 — ARMv6-compatible Alpine Python

- Amendment ID: PLAN-backyard-shade-api-A1
- Previous version: Approved original body, including published-package updates.
- Approval: Automatically approved on 2026-11-13 after independent readiness assurance; original document status is preserved.
- Request and purpose: The user states that Alpine 3.15 was selected for ARMv6,
  and instructs: “if a different alpine can run on armv6 then use that instead”.
  Resume the originating implement request on the existing PR to simplify Python
  packaging while retaining ARMv6 and ARM64. The effective SPEC (original plus
  SPEC-backyard-shade-api-A1) is unaffected: it requires Python >=3.10 and both
  platforms, and does not fix an Alpine version.

### Changes against the previous version

| Section / requirement | Before | After | Reason |
| --- | --- | --- | --- |
| §4 base and Python | Node 19.2.0 / Alpine 3.15; source-build CPython 3.11.18 under /opt/python. | Both bases become node:19.2.0-alpine3.16; install Alpine python3 and py3-pip, assert Python >=3.10, create /opt/venv with python3 -m venv and put /opt/venv/bin first on PATH. Keep Node unchanged. | Registry manifests include both required architectures; Alpine supplies compatible Python. |
| §4 compilation and libraries | Build CPython with extensive headers, download/checksum source, create interpreter links, set LD_LIBRARY_PATH, scan ELF dependencies. | Remove CPython-specific build/download/checksum/linker/scanner machinery. Use temporary build-base, linux-headers, python3-dev and swig only for native Python dependencies. Remove this virtual group after pip installation, then verify imports/help using the final interpreter and runtime user. Retain explicit runtime libraries only if an actual dependency check requires them. | Packaged Python owns its runtime libraries; native extensions still need compiler tools. |
| §4 package installation | pip 26.0.1, public dependencies, hash-verified Forgejo shade wheel, existing IR emitter and import/help checks on custom Python. | Preserve exact pip version, shade name/version/wheel hash/metadata/guard, separate dependency indexes, emitter version and install behavior, pip check and post-removal import/help checks in the venv. Remove downloaded wheel and pip cache. | Simplify interpreter installation without weakening package provenance or dependency checks. |
| §1 location and delivery | Initial detached new branch and PR creation; later DRAFT recovery. | Continue existing PR #11 on origin/feature/backyard-shade-api from refreshed 80c8eccde4064c33e6223f59be1b88b76d619737 in /tmp/agent-worktrees/device-integration-api/backyard-shade-api. Existing-PR mode uses the verified attached branch. A missing registration at this exact path was removed non-forcibly and recreated. Commit and push non-forcibly to the same branch; update the same PR, never main. Retain the clean worktree detached at a blocked DRAFT checkpoint; remove only after the complete Definition of Done. No invoking artifacts need transfer or cleanup. | PR #10 was accidentally squash-merged, main was restored at the user's request, and #11 now contains the unchanged implementation. |
| §§3, 6 assurance | Initial full reviews included code, contract and security. | Full profile for packaging. Independent code review and final QA cover this complete amendment and its direct dependencies. No API/event changes: contract-review trigger absent. No explicit security-review request: security specialist not selected under current user instructions. Preserve all earlier source coverage and inspect credible fan/shade/runtime regressions. Required documentation writer runs once after final QA. | Current user routing rules and the actual packaging-only scope. |

### Evidence and resolved choices

Explorer alpine-manifests retrieved the actual Docker Hub manifest for
node:19.2.0-alpine3.16, index digest
sha256:80844b6643f239c87fceae51e6540eeb054fc7114d979703770ec75250dcd03b.
It contains linux/arm/v6 child
sha256:33241925195fbe69a9b042cfbc5b1e5b0a0cb95d5f85019dc3f767296eb52957
and linux/arm64/v8 child
sha256:c97c33d5256044b55bbb7af9838a4c212b9044b2675bf3c8c7899d893803499c.
The official v3.16/main/armhf APKINDEX records python3 3.10.14-r1. A temporary
unprivileged AMD64 container from that exact tag successfully installed python3
and py3-pip and created a venv; both interpreters reported 3.10.14. No ARM
execution, shade dependency installation or hardware operation was proved by
that check. Sources: Docker Hub registry via buildx imagetools inspect --raw;
https://dl-cdn.alpinelinux.org/alpine/v3.16/main/armhf/APKINDEX.tar.gz.
Node 22 / Alpine 3.24 was also found to support both targets, but changes the
Node major and Python minor. The same-Node 3.16 tag is the narrower choice for
this request; it is not a claim of current upstream lifecycle support.

### Units, ownership, validation and delivery

- P1: Developer owns docker/Dockerfile and tracked docker/.env only. Replace
  interpreter installation and base defaults as above. Preserve build-argument
  forwarding, entrypoint, user, volumes, fan/shade sources and HTTP contracts.
  No automated tests for these non-domain paths. Shell parsing and build checks
  are permitted; no children commit, push, publish, configure hosts or actuate.
- P2: Parent serially runs build/lint/existing tests, shell syntax, diff checks,
  a non-publishing local AMD64 full image build and final-user import/version,
  dependency consistency and CLI help checks. Verify the source wheel hash and
  declared requirements through the preserved Docker assertions. Verify exact
  base manifest platforms. ARM64/ARMv6 final-image build/run evidence remains
  required; the current local builder supports AMD64/386 only and cannot export
  OCI. Do not install privileged emulation or change hosts to obtain evidence.
- P3: Independent code-reviewer covers the entire packaging delta, effective
  artifacts, existing emitter/shade consumers, dependency cleanup and checks;
  collect findings and apply one consolidated bounded correction batch through
  the developer, then run affected checks. Independent qa-agent validates final
  permitted checks and missing evidence. Repeat only for qualifying failures.
- P4: After QA, documentation-writer owns README.md and project-specific AGENTS.md
  packaging guidance only: new base/default image tags, system Python/venv,
  removal of CPython build machinery, actual validation outcomes and remaining
  ARM/live gaps. Preserve global workflow guidance and all HTTP examples.
- Parent alone owns this PLAN amendment, reconciliation, staged diff, commit,
  non-force push, remote/upstream and PR head verification, exact-head CI and
  guarded clean-worktree disposition. Keep main unchanged. No image push, release
  tag, deployment, live device access, profile mutation or RF actuation.

Planning assurance: one packaging concern serving independent fan and shade
modules; no interaction of business-domain rules changes. Architect trigger is
absent. Independent readiness review of this complete effective PLAN is required
before amendment approval and developer dispatch. Aim three minutes per bounded
specialist assignment; interrupt at five minutes and retain partial evidence.

### Requirement-to-delivery trace

| Effective SPEC / PLAN criterion | Unit / paths | Evidence |
| --- | --- | --- |
| SPEC §6 Python >=3.10 and both ARM targets | P1 Dockerfile/.env, P2 | Actual base manifest and armhf APK metadata; packaged Python/venv version; target builds/runtime remain required. |
| SPEC §6 pinned dependencies, CLI, emitter and user | P1, P2, P3 | Preserved wheel hash/metadata, separate indexes, pip check, imports and help after tools removed and as node. |
| SPEC §§2, 4, 5 preserved HTTP, fan, timing and ownership | No source change; P2/P3 | Build/lint/existing tests, path diff and packaging consumer review; earlier process evidence does not establish new image runtime. |
| SPEC §§7, 8 evidence and docs | P2/P4 README/AGENTS | Actual non-publishing checks, honest architecture/live gaps, updated packaging guidance. |
| PLAN §1 delivery and §6 Definition of Done | Parent | Verified same-branch push/PR/CI; remain blocked DRAFT while required ARM/Pi qualification is unavailable. |

### Preserved behavior and impact

Preserve the complete effective SPEC, shade API/configuration/process-group
semantics, single-owner profile constraints, package and IR-emitter pins,
platforms, runtime user, entrypoint, publication workflow, persistence and
live-effect boundaries. No new domain logic or tests. Original artifacts and
approval records remain unchanged above this amendment. Existing hardware and
ARM qualification criteria are not skipped or weakened.

### Approval record

Independent readiness reviewer alpine-ready reviewed the complete effective pair
and packaging paths at PLAN SHA-256 e07192af3e8b58978b14a3e216edc5e22a093bc2ddb038c429fd5b6a31d6b5b3
and reported no findings. Parent verified identity, coverage and artifact hashes.
On 2026-11-13 the parent automatically approves PLAN-backyard-shade-api-A1 and
the complete effective PLAN (original plus this amendment) under the originating
$implement request and the user's conditional Alpine replacement instruction.
Approval is bounded to the recorded packaging, validation, documentation and
same-PR delivery delta; it is not manual user review of this generated amendment.
SPEC is unaffected and retains its complete existing approval. Required code
review, QA and actual delivery evidence follow during implementation.

## Amendment 2 — 2026-11-13 — Native lgpio prerequisite

- Amendment ID: PLAN-backyard-shade-api-A2
- Previous version: Approved original plus PLAN-backyard-shade-api-A1.
- Approval: Automatically approved on 2026-11-13 after independent readiness assurance; original status and A1 are preserved.
- Request and purpose: Complete the originating implement request and the user's
  Alpine replacement instruction after the actual A1 image build exposed a
  required native dependency. SPEC remains unchanged.

### Changes against the previous version

| Section / requirement | Before | After | Reason |
| --- | --- | --- | --- |
| A1 native dependencies / P1 | Compiler, Python headers and SWIG; lgpio resolved transitively through rpi-lgpio. | Add checksum-verified upstream native liblgpio v0.2.2, built with the existing temporary tools. Install only liblgpio.so.1 and its liblgpio.so linker symlink into /usr/lib, retained in the final image. Pin the matching Python lgpio==0.2.2.0 in the public dependency install. | Actual AMD64 build and independent alpine-code-1 review prove the Python extension links -llgpio and fails without the native library. |
| A1 temporary tools and cleanup | build-base, linux-headers, python3-dev, swig. | Also include temporary curl for HTTPS source retrieval. Verify archive hash before extraction, run make -j2 lib, copy only the required lgpio shared library and linker symlink, then remove native source/archive with tools/cache/wheel cleanup. Never install upstream daemons, scripts, devices, permissions or services. | Native library is not packaged in checked Alpine indexes; install its runtime artifact without unrelated upstream operations. |

### Evidence and implementation mechanics

Explorer alpine-lgpio inspected official main/community APKINDEX files for
Alpine v3.16 armhf/x86_64 and v3.24 armhf/x86_64/aarch64: none contains lgpio,
liblgpio or lgpio-dev. The exact Python extension lgpio 0.2.2.0 from PyPI linked
with -llgpio and failed in the A1 full image build. Independent alpine-code
review confirmed the failure in /tmp/shade-alpine316-build.log and supplied one
high finding, alpine-code-1; this amendment is its accepted correction scope.

Upstream tag v0.2.2 resolves to commit
b959a17d723360e85648316757b02dbea9902feb. Use
https://github.com/joan2937/lg/archive/refs/tags/v0.2.2.tar.gz
with SHA-256 b08d8569d6dc8fa91a42ba1e37f620fdcb19d6bf2330e4b7d7301431ddbe124c.
Its PY_LGPIO/setup.py version is 0.2.2.0. The Makefile lib target produces
liblgpio.so.1; install that file with mode 0755 in /usr/lib and create the
relative linker symlink liblgpio.so -> liblgpio.so.1. Use the target compiler
without CPU-specific flags or cross-architecture binary copies. Do not run the
upstream broad install target. Source/header files and unused build outputs
remain temporary. The explorer successfully built the library, installed exact
Python lgpio 0.2.2.0 and imported it in an unprivileged AMD64 container from the
selected base. This is not ARM runtime evidence.

### Ownership, trace and assurance

P1 developer retains Dockerfile-only correction ownership; docker/.env stays
at the A1 version. Parent retains PLAN and delivery. No other application,
workflow, API/event, profile or hardware paths change. The native library is a
direct dependency of SPEC §6 package installation; P2 rebuilds the full AMD64
image and exercises the unchanged post-cleanup checks as node. Verify loaded
lgpio works after temporary tools are removed and that source/archive are absent.
Both ARM target builds/runtime and authorized Pi criteria remain mandatory and
pending. No new automated tests for non-domain logic.

Independent readiness reviews this complete effective PLAN before automatic
approval and correction dispatch. One packaging dependency, no interacting
business-domain rules: architect trigger absent. Complete the consolidated
accepted correction batch and affected build checks, then independent focused
code review for the changed dependency/provenance/runtime boundary and final QA.
A further cycle is justified by this confirmed required-build failure. The
benefit is restoring an otherwise unbuildable image; impact is one small pinned
native library and matching Python dependency. P4 documentation-writer still runs
once, after final QA. Current contract/security triggers remain absent as in A1.
All A1 branch/PR delivery, deadlines, platform and no-live-effect rules remain.

### Preserved behavior and impact

A1's Alpine 3.16 bases, Node version, packaged Python/venv, exact shade/emitter
pins, package provenance, runtime-user checks, and the entire effective SPEC are
unchanged. CPython source-build machinery stays removed. Only the demonstrated
native prerequisite is added; no devices, daemons, deployment or actuation.

### Approval record

Independent alpine-ready-A2 reviewed the complete effective pair at PLAN SHA-256
aa22d7a2fc8726ac54b43612749a52d8c2a18afcd4caab74ac6a938718ff4779
and found no readiness issues. Parent verified the handoff and automatically
approves PLAN-backyard-shade-api-A2 and the complete effective PLAN through A2
on 2026-11-13 under the originating implement request and active A1 correction
obligation. The native prerequisite, matching Python pin and constrained build
are the approved delta; no manual user review is asserted. SPEC is unaffected.
Actual code review, image checks and final QA remain implementation obligations.

## Amendment 3 — 2026-11-13 — Isolate fan and shade Python dependencies

- Amendment ID: PLAN-backyard-shade-api-A3
- Previous version: Approved original plus A1 and A2.
- Approval: Automatically approved on 2026-11-13 after independent readiness assurance; preceding content/status are preserved.
- Request and purpose: Complete the same implementation and Alpine replacement
  after actual image checks and independent review demonstrated a conflicting
  Python GPIO namespace. SPEC remains unchanged.

### Changes against the previous version

| Section / requirement | Before | After | Reason |
| --- | --- | --- | --- |
| A1 interpreter environments | One /opt/venv for shade and IR emitter. | Two default-isolated venvs created with Alpine Python: /opt/ir-venv for pigpio and the unchanged emitter installation; /opt/shade-venv for cc1101, rpi-lgpio, pinned lgpio, spidev and the hash-verified shade wheel. Install pinned pip 26.0.1 in each. No system-site-packages sharing. | The emitter dependency Jetson.GPIO overwrites RPi/GPIO files in a shared environment, breaking the shade's rpi-lgpio import. |
| A1 executable discovery | /opt/venv/bin first on PATH. | PATH=/opt/ir-venv/bin:/opt/shade-venv/bin followed by the base PATH. Default python3 -m ir_emitter therefore keeps the fan contract; cc1101-transceiver resolves from the shade venv and its generated shebang selects that environment. Use explicit interpreter paths for installation and verification. No shell dispatch wrappers or application changes. | Preserve both existing command forms while separating conflicting dependency namespaces. |
| A1/A2 post-cleanup checks | Combined Python import and pip check. | As node, check the shade version/floor/metadata and all shade/native/stdlib imports using /opt/shade-venv/bin/python3; assert Jetson is absent from the shade environment. Check the IR version and ir_emitter/pigpio imports using the default IR interpreter. Run pip check in both environments and all three existing CLI help forms through final PATH. Confirm the namespace ownership and executable paths in the final image. | Preserve hardware-free runtime qualification for both consumers; never suppress the failing shade import or add devices to the build. |

### Evidence, disposition and validation

The A2 full AMD64 build at /tmp/shade-alpine316-build-fixed.log proves checksum
verification, native compilation, Python lgpio 0.2.2.0 installation and pinned
shade wheel installation succeeded. The emitter then installs Jetson.GPIO
2.1.13, and RPi/GPIO/__init__.py imports Jetson.GPIO, raising an error for absent
/dev/gpiochip0 during the required node-user shade import. Independent
alpine-code-A2 confirmed high finding alpine-code-A2-1 and resolved the earlier
native-link finding alpine-code-1. Environment isolation is the accepted bounded
correction; no package versions are changed to conceal the collision.

The pinned native Makefile is available as validation evidence at
/tmp/alpine-gpio-isolation/Makefile, SHA-256
e1843b4ddb1cb86134b80f3790189c7c6ca3a7cd6e94f9d9c657e3871d6db9e6,
extracted from the already hash-verified A2 archive. Explorer alpine-ir-static returned the exact emitter 1.0.1 wheel at
/tmp/alpine-gpio-isolation/rpi_groove_ir_emitter-1.0.1-py3-none-any.whl,
SHA-256 850397b07849ec3cdb0450e9827ec2cbd540ae5a415777acb2552a5f5b30e6b6.
Its metadata requires Jetson.GPIO and pigpio. Static __main__.py inspection
confirms argparse runs before pigpio.pi() and does not import RPi.GPIO.
Disposable /tmp environment evidence confirms default IR python, shade CLI
path/shebang and hardware-free emitter --help. Jetson.GPIO 2.1.13 installs
the conflicting RPi/GPIO namespace; the exact shade entry point generates a
script naming its own venv interpreter. These preflight results do not prove
a complete image or ARM runtime. The earlier interrupted assignment was
reconciled: no container command remains running. Full image and final-user
checks remain required; failure is never inferred away from environment names.

### Ownership, assurance and trace

P1 developer owns Dockerfile only for this consolidated correction. Parent owns
PLAN. No source/API/event, environment-variable command, entrypoint, platform or
workflow changes; docker/.env keeps A1 defaults. P2 rebuilds the full AMD64 image
and executes the preserved version/import/metadata/consistency/help checks after
cleanup, as node, with no devices or operational profiles. Independent code
review covers the whole isolation/dependency/command-resolution boundary and
verified carry-forward criteria; final QA follows, then P4 documentation writer
once. Repeat is justified by a confirmed required-build/consumer incompatibility;
benefit is preserving both consumers, impact is two small isolated environments.
SPEC §§2, 3, 5, 6 and 7 map to these runtime/command and preservation checks; §8
maps to README/AGENTS explanations of the two environments and actual evidence.

Mandatory independent readiness reviews this complete effective PLAN before
approval/dispatch. Architect trigger remains absent: independent device domains
share packaging but no business rules interact. Contract/security reviewer
triggers remain absent under current instructions. A1/A2 ownership, source
provenance, library cleanup, target-platform/live criteria, delivery branch/PR,
bounded assignments and no-publication/deployment/actuation boundaries persist.

### Preserved behavior and impact

Keep Node 19.2.0 / Alpine 3.16, packaged Python >=3.10, checksum-verified native
lgpio, exact shade/emitter releases, both ARM targets, all HTTP/service behavior,
trusted operator configuration, default fan command form and shade CLI arguments.
No caller data enters shell commands and no profile or device provisioning is
added. CPython compilation stays removed. Source/runtime evidence is distinct
from the still-required ARM/Pi qualification.

### Approval record

Independent alpine-ready-A3 reviewed the complete effective pair at PLAN SHA-256
fd2470529e9deceb40e32d47d6d921546cafbced8a77a1d5a1f907e728f88614
and reported no readiness findings. Parent verified the handoff and automatically
approves PLAN-backyard-shade-api-A3 and the complete effective PLAN through A3
on 2026-11-13 under the originating implement request, the user's Alpine
replacement instruction and accepted correction of alpine-code-A2-1. Approval
covers dependency isolation, preserved executable contracts and final runtime
checks; no manual review of this generated amendment is claimed. SPEC is
unaffected. Actual image checks, code review, QA and delivery remain required.

## Amendment 4 — 2026-11-13 — Writable notification-check directory

- Amendment ID: PLAN-backyard-shade-api-A4
- Previous version: Approved original through A3.
- Approval: Automatically approved on 2026-11-13 after independent readiness assurance; prior content/status are preserved.
- Request and purpose: Correct the last observed build-check environment under
  the same implementation/Alpine request. SPEC is unaffected.

### Changes against the previous version

| Section / requirement | Before | After | Reason |
| --- | --- | --- | --- |
| A3 post-cleanup node checks | Execute unchanged import/metadata/pip/help checks with cwd /app, owned by root. | Create one private temporary directory as node using mktemp -d /tmp/shade-check.XXXXXX, cd into it, execute the identical checks as node with final PATH, then return to /app and remove only that captured temporary directory. Keep final Docker WORKDIR /app, runtime user and operator profile permissions unchanged. | Actual isolated build and independent alpine-code-A3-1 review show lgpio creates its notification FIFO in cwd; node cannot write /app. |
| P4 operational guidance | Writable profile parent described. | Also state that SHADE_SCRIPT_DIR must be writable by the runtime user and support notification FIFO creation; existing /app/state example satisfies the intended local Docker-volume setup, subject to Pi qualification. Never repair/chown an operator profile to pass validation. | Native dependency's cwd prerequisite must be explicit and qualified. |

### Evidence, preservation and assurance

The A3 image now uses the correct shade RPi.GPIO namespace, resolving
alpine-code-A2-1. Actual /tmp/shade-alpine316-build-isolated.log lines 292-301
show lgpio trying /app/.lgd-nfy0 and then failing to open its callback FIFO.
Independent alpine-code-A3 confirmed the high build-check finding. The accepted
correction changes only the check's writable temporary cwd, keeping all imports,
metadata assertions, interpreter paths, node identity, dependency checks and CLI
help commands. It grants no device access or elevated runtime permissions and
performs no RF command. Any resulting FIFO files are confined to and removed
with that private build-check directory. A successful full image build and QA
must establish equivalence; do not weaken or skip an import to obtain success.

P1 developer owns Dockerfile only; parent owns PLAN. P2 rebuilds the complete
local AMD64 image; code review and independent final QA cover the final directory,
cleanup and preserved isolation/native/provenance boundary. P4 writer runs once
after QA, including the cwd prerequisite and actual validation boundary. The
confirmed required-build failure justifies this focused correction cycle; benefit
is valid non-root runtime verification and impact is a disposable check directory.
Mandatory readiness reviews the complete effective PLAN before approval. No
interacting domain rules, API/event change or explicit security-review request:
architect/contract/security triggers remain absent. All earlier platform/live,
branch/PR/delivery, deadline, no-test and no-live-effect boundaries persist.
Trace: SPEC §6 package/runtime-user and §7 validation -> P1/P2/code/QA; §8 -> P4.

### Approval record

Independent alpine-ready-A4 reviewed the complete effective pair at PLAN SHA-256
14bb423fe626a56b857a8ca1f6d44f2b03474a16eb806fa4b0a73c69935d51ac
and reported no readiness findings. Parent verified the handoff and automatically
approves PLAN-backyard-shade-api-A4 and the complete effective PLAN through A4
on 2026-11-13 under the originating implement request and accepted correction
of alpine-code-A3-1. This approves the validation cwd/cleanup and documentation
delta without manual user-review claims or waiving any ARM/Pi criterion. SPEC
is unaffected; actual build, code review, QA and delivery evidence follow.

## Amendment 5 — 2026-11-13 — Check-scoped board metadata

- Amendment ID: PLAN-backyard-shade-api-A5
- Previous version: Approved original through A4.
- Approval: Automatically approved on 2026-11-13 after independent readiness assurance; earlier content/status are preserved.
- Request and purpose: Correct the confirmed hardware-free build-check guard
  under the originating implementation and Alpine replacement request. SPEC is
  unchanged; actual board/device qualification remains mandatory.

### Changes against the previous version

| Section / requirement | Before | After | Reason |
| --- | --- | --- | --- |
| A4 shade import and shade CLI-help checks | Imports run as node from writable temporary cwd with no Pi metadata on the builder. | Supply RPI_LGPIO_REVISION=9000c1 only on each shade import/help command via su-exec node env. Retain every import/assertion and all no-device/no-RF checks. Label this supplied metadata as simulated Pi Zero W identification. Never put this value in Docker ENV, runtime defaults, wrappers or API configuration. | Actual A4 build passes FIFO setup but rpi-lgpio's board-identification guard raises without /proc/device-tree; independent alpine-code-A4-1 confirms the failure. |
| P4 validation/operation guidance | Working-directory and actual Pi criteria. | Explain the check-scoped override and its limits; runtime must discover the real board or receive operator-provided actual-board metadata per upstream guidance, separately qualified on target. No fabricated identity is shipped as a runtime default. | Distinguish dependency-loading evidence from actual board/architecture/device evidence. |

### Evidence and equivalence

Explorer alpine-board-check verified upstream rpi-lgpio's supported
RPI_LGPIO_REVISION variable in
https://rpi-lgpio.readthedocs.io/en/latest/differences.html and the 0.6 source
https://rpi-lgpio.readthedocs.io/en/latest/_modules/RPi/GPIO.html (_get_rpi_info).
The implementation reads the variable before /proc/device-tree/system/linux,revision.
Raspberry Pi's official revision table identifies 9000c1 as Zero W 1.1, 512 MB:
https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#new-style-revision-codes.
This is a supported metadata input, not replacement packages or hardware devices.
All real dependency modules/native libraries must still load as node after tool
removal, both pip checks must pass, and real CLI entry points must run --help.
These checks prove dependency loading with supplied metadata only. They do not
prove real board identification, ARM execution, GPIO/SPI access or RF behavior.
Do not remove, mock or suppress an import or claim target-Pi success.

### Ownership, trace, assurance and preservation

P1 developer owns Dockerfile only for the check-scoped command prefixes and an
explanatory comment/output. Parent owns PLAN. Rebuild complete local image,
independently review the final scope/absence of persistent override, then run
final QA and the once-only documentation writer as planned. A qualifying cycle
is justified by the confirmed required-build failure; impact is explicit
metadata for checks and benefit is valid hardware-free module loading. Mandatory
readiness reviews the complete effective PLAN before approval. Current absent
architect/contract/security triggers, branch/PR/commit/push/cleanup procedure,
deadlines and no-test/no-live-effect rules are unchanged. Trace: SPEC §6 runtime
imports and §7 evidence separation -> P1/P2/review/QA; §8 -> README/AGENTS.

All A1-A4 production behavior, native/provenance checks, isolated environments,
working-directory constraints, platforms, user and live acceptance requirements
are preserved. No new runtime board setting, application code or profile/device
operation is authorized by this validation correction.

### Approval record

Independent alpine-ready-A5 reviewed the complete effective pair at PLAN SHA-256
c70589baa6f5e74156d8731c763afb9f27734aa6965e46dcbab016bb6f65365d
and reported no readiness findings. Parent verified the handoff and automatically
approves PLAN-backyard-shade-api-A5 and the complete effective PLAN through A5
on 2026-11-13 under the originating implement request, user's Alpine replacement
instruction and correction of alpine-code-A4-1. Approval covers check-only board
metadata with unchanged import criteria and no persistent runtime override. All
ARM/live criteria remain required; no manual review or hardware acceptance is
implied. Code/QA/image/delivery evidence remains required.

### Implementation evidence — 2026-11-13

Code review alpine-code-A5 and final independent QA alpine-QA covered the effective
PLAN at file SHA-256 1c5b3094c44d9a193ed3fbaa719657bd91a3cfb03ecc1b08a527fc29089da571
before this factual receipt was appended; no requirements or approval scope are
changed by this receipt. All supported findings are resolved: missing native
library (alpine-code-1), shared GPIO namespace (alpine-code-A2-1), writable check
cwd (alpine-code-A3-1), and check-only board identification (alpine-code-A4-1).
Both final assignments returned complete with no actionable findings.

The full local AMD64 image build passed and loaded image
sha256:f6a9073d621da89f75cf2cfb29899337d610b8508e73aad24c05f653d88902fd.
Alpine Python 3.10.14 loaded shade 1.0.0b2 and IR emitter 1.0.1 as node after
compiler removal; both pip checks and all three CLI-help forms passed. QA ran the
loaded immutable image with read-only root, network disabled, private writable
tmpfs, no device/profile mounts, and check-scoped supplied metadata. Environment,
module locations, namespace separation and cleanup passed; no runtime board
revision override is present. The expected writable-cwd condition and a harmless
pip-cache warning require no additional correction. Fresh npm ci/build/lint,
existing five test files, shell syntax and parent diff checks passed. No tests
were added or changed. These are dependency-loading/source checks, not ARM or Pi
acceptance: both target-image/runtime and authorized live criteria remain pending.
The build log is /tmp/shade-alpine316-build-qualified.log (SHA-256
c34bb1b554a92ba0c6bb8ae240d6f4ca5d17b678b051e4eb5c18a12299c0ef2b).
