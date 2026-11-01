# Backyard shade command API

Status: Approved
Date: 2026-11-01

Approval: User explicitly approved this specification on 2026-11-01 with
“approve” in the parent conversation. This approves specification scope only.

## 1. Purpose and authority

Add Up, Down and My calls for the backyard sunscreen shade to this API.
The user specifies Down = open, Up = close, My = stop, installation of the
transceiver Python package during Docker image build, including all dependencies,
and the same integration approach as the existing fan module. This specification
does not authorize implementation, publication, deployment or physical actuation.

## 2. Scope and preserved behavior

Add one shade integration with three command endpoints, configuration, package
installation in the runtime image, persistent profile access and documentation.
Preserve all fan and health routes, fan state semantics, fan configuration and
the installed IR emitter. No existing approved SPEC or PLAN is present under
`specs/`; current source, OpenAPI and README are the baseline.

Exclude pairing, programming, profile creation, capture, receive APIs, position
feedback, scheduling, additional shades, and changes to the transceiver project.
Do not add authentication or alter the existing API access model in this change.

## 3. Definitions and evidence

Up, Down and My name transmitted commands, not measured physical state.
My sends the transceiver's `my` command, with the user's intended stop meaning;
this API cannot independently enforce the receiver's interpretation of My.
The profile is an operator-provisioned JSON file containing the paired address
and rolling code. The Python package owns its format and updates.

Command research used transceiver branch `feature/cc1101-connection-test` at
`0b589c70b4c5dadbe97b8a6673c7a1bb282e7266`. Its installed CLI is
`cc1101-transceiver emitter send --profile <path> --command <up|down|my>`.
Its metadata currently names `rpi-cc1101-transciever`, requires Python >=3.10,
and declares `cc1101==3.0.0`, `rpi-lgpio` and `spidev`. The user explicitly states
that the final package name is not yet known; these are compatibility evidence,
not a promise about the forthcoming release. That branch also documents Forgejo
and proxy indexes, without proving package availability.

The package reads a rolling code, transmits, then saves its incremented value.
It has no cross-process locking. Even dry-run advances the profile; therefore
dry-run must never be used against the operational profile for validation.

API baseline: `0b94aeb4f882de8ae25b9e5db4180c01d14255ee`, including
`src/fan/fan.ts`, `FanConfiguration`, `FanController`, `FanTerminalGateway`,
`TerminalExecutorInterface`, `LocalMachineTerminal` and `docker/Dockerfile`.

## 4. HTTP behavior

| Endpoint | Command | Intended effect |
| --- | --- | --- |
| POST /api/v1/shades/backyard/up | up | Close |
| POST /api/v1/shades/backyard/down | down | Open |
| POST /api/v1/shades/backyard/my | my | Stop |

No request payload or client-selected profile, executable, address or shell
argument is needed or used. Each accepted call executes its configured command
once. Return empty HTTP 202 after successful process completion, consistent with
fan command responses. This acknowledges transmitter execution only, not actual
shade movement or final position. Nonzero exit, launch failure or timeout returns
HTTP 500 using the shared `{ message, timestamp }` error response with a stable
public message rather than raw process output. A concurrent shade request while
another is executing returns HTTP 409 with that error shape and sends no command.
No command queue, deduplication, inferred position, wake-up pulse, or automatic
retry is introduced. Repeated calls after completion send separate commands.

## 5. Configuration and architecture

Use a separate `shades` bounded context, with configurations, controllers,
service interfaces/implementations, DTOs where needed, and infrastructure gateway
interfaces/implementations. Wire it in the existing composition root. Follow
fan's environment-configured command and working-directory approach, shared
terminal port, and inward dependency direction. Preserve the fan adapter's
behavior if shade execution requires an additional adapter.

Use `SHADE_ENABLED` (absent or `false` disables; `true` enables; other values fail
startup). When disabled, do not require shade configuration or register shade
routes. When enabled require nonempty `SHADE_SCRIPT_DIR`, `SHADE_BASH_UP`,
`SHADE_BASH_DOWN`, and `SHADE_BASH_MY`; invalid configuration prevents listening.
The trusted operator configures each full command to invoke the installed CLI
with the same persistent backyard profile and its corresponding command.
Commands must not depend on a mounted source checkout or `run.sh`.

Shell configuration is trusted deployment configuration, as in the fan module;
HTTP input must never be interpolated into it. Use bounded execution, preserving
the existing five-second command limit. Release qualification must confirm live
commands finish within this bound and timed-out commands cannot overlap a later
send. If that cannot be established, resolve the incompatibility before delivery.

Allow at most one shade operation at a time within the process. Deployment must
use one owning API process for this profile and transmitter, with no concurrent
external CLI, receiver capture or other transmitter user. Do not claim process
serialization protects multiple replicas. A failed command may already have
emitted RF, especially if profile persistence subsequently fails; never retry it
automatically or restore an earlier rolling code.

## 6. Docker and operational prerequisites

Install the eventual Python distribution at an exact version during the Docker
build, together with its declared dependencies and required system libraries.
Use a dedicated build argument for its version, following the existing emitter
installation pattern. Resolve dependencies from the approved package index and
public dependency index as appropriate; do not omit dependencies with an
unaccompanied `--no-deps` install. An installation failure fails the image build.

The final distribution name, published version, index and installed CLI contract
are an external prerequisite supplied by the package producer. Confirm them
before authoring the implementation plan; do not invent a release or substitute
an unpinned source-branch installation. The delivered package must provide the
three command semantics researched above, or the specification must be revised.

The final runtime image must have Python >=3.10, importable package dependencies,
and an executable CLI accessible to the API service user. Preserve supported
`linux/arm64` and `linux/arm/v6` image platforms and the IR emitter; inability to
install on either is a blocker, not authority to remove that platform.

Mount the existing shade profile and its parent directory persistently and
writably by the runtime user; sibling temporary-file creation and rename must
work. Provision SPI/GPIO devices, permissions and hardware configuration needed
by the package without requiring a source mount. Never initialize, clone, reset
or repair a profile automatically. Docker packaging changes do not authorize
live image publication, host reconfiguration or actuation.

## 7. Acceptance and validation

- Verify build, lint and existing test suite pass. Create or maintain automated
  tests only for new deterministic domain logic, if any; validate controllers,
  configuration, orchestration, adapters and Docker through permitted static,
  structural, build and operator checks instead.
- Inspect the route-to-command mapping, no HTTP-derived shell content, disabled
  mode, startup validation, failure responses, busy rejection and retry absence.
  Controlled non-RF operator smoke checks may exercise configured harmless
  commands; these are not new automated test suites.
- Build the final images for both supported platforms. Check package/dependency
  imports, dependency consistency and CLI help as the runtime user, without
  initializing hardware or modifying a real profile. Record published-package
  provenance and exact installed version.
- Separately qualify target-Pi SPI/GPIO access, writable persistent profile,
  bounded exclusive execution, and Up/Down/My physical behavior through explicitly
  authorized live checks. Source checks and image builds prove none of these.
  Record unavailable evidence as pending; do not report full hardware acceptance.
- Confirm existing fan and health contracts and emitter installation remain
  compatible. Never actuate the fan or shade solely to verify planning artifacts.

## 8. Documentation and regression boundary

Update OpenAPI with the three endpoints and 202/409/500 responses, add controller
examples under `http/`, and update README and AGENTS with the shade module,
configuration, installed-package invocation, persistent-profile ownership,
device access, command mapping, deployment exclusivity, failure uncertainty and
local/image/live validation boundaries. Do not add event documentation.

Keep earlier artifacts unchanged. Specification approval does not imply an
approved implementation plan or authorize implementation.

## Amendment 1 — 2026-11-01 — Package placeholders and repository-derived CLI

- Amendment ID: SPEC-backyard-shade-api-A1
- Previous version: Approved original body
- Approval: Approved by the user on 2026-11-01
- Request and purpose: The user instructs that CLI invocation must be determined
  from the package repository and permits distribution-name and published-version
  placeholders, to be replaced by the user when available. Permit planning and
  source preparation without inventing a published package.

### Changes against the previous version

| Section / requirement | Before | After | Reason |
| --- | --- | --- | --- |
| §6 package prerequisite | Confirm final name, version, index and CLI before authoring the plan. | Author the plan and source integration using explicit `REPLACE_WITH_SHADE_PACKAGE_NAME` and `REPLACE_WITH_SHADE_PACKAGE_VERSION` values. Expose both as Docker build arguments. The user supplies real values later. Image builds must fail clearly if placeholders remain; never silently skip installation. | Explicit user permission to use placeholders. |
| §§3, 6 CLI provenance | Installed CLI must be confirmed by the package producer. | Derive invocation from the authorized package repository's packaging entry point and argument parser at the recorded branch SHA. Current evidence specifies `cc1101-transceiver emitter send --profile <path> --command <up\|down\|my>`. Confirm the final installed release matches that contract during image qualification. Do not guess the CLI from the distribution name or discover commands by actuating hardware. | User requires repository-derived invocation. |
| §6 package index | Producer confirms the final index before planning. | Use the same Forgejo primary index and public PyPI dependency index as the existing fan emitter installation: `https://forgejo.alexlab.nl/api/packages/public/pypi/simple` and `https://pypi.org/simple`. Registry availability and final package publication remain unverified. | Existing integration approach and package repository documentation agree on this index. |
| §7 completion evidence | Build final images and verify installed package before complete delivery. | Preserve those criteria. Source preparation may proceed with placeholders, but blocked image/package or hardware evidence remains explicit DRAFT, unless the user later excludes those criteria. Placeholders grant no claim of successful installation. | Distinguish permitted preparation from completed integration. |

### Preserved behavior and impact

All HTTP routes, Up/Down/My mapping, fan compatibility, configuration,
persistence, exclusivity, timeout, dependency installation, supported platforms,
documentation and live-effect boundaries remain unchanged. The plan must describe
placeholder replacement and blocked DRAFT recovery. No PLAN exists yet.

### Approval record

The user explicitly replied “approve” to the A1 approval presentation on
2026-11-01, approving the complete effective specification: original body plus
SPEC-backyard-shade-api-A1. Original approval remains unchanged.
