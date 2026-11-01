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
