# PLAN-011 - Packaged IR Emitter Runtime

Status: Approved

Spec: `specs/SPEC-011-packaged-ir-emitter-runtime.md`

## Affected Files

- `docker/Dockerfile`
- `README.md`
- `AGENTS.md`
- `specs/SPEC-011-packaged-ir-emitter-runtime.md`
- `specs/PLAN-011-packaged-ir-emitter-runtime.md`

## Implementation Steps Performed

1. Verified the existing image contains Python and pigpio but not the emitter
   distribution.
2. Added a pinned emitter install with Forgejo as the primary index and public
   PyPI as the additional dependency index.
3. Kept dependency resolution enabled and documented direct module execution
   and pulse-data separation.
4. Added and indexed completed-work artifacts.
5. Ran short static validation and reconciled the staged change set.
6. Reproduced the Forgejo TLS failure with the Alpine-supplied pip 20.3.4.
7. Added a pinned pip 26.0.1 bootstrap before the first Forgejo package request,
   preserving certificate and hostname verification.

## Validation Run

- `git diff --check`
- Dockerfile structural inspection for the pinned version, exact Forgejo and
  PyPI indexes, and absence of `--no-deps`.
- Dockerfile structural inspection for the exact pip 26.0.1 bootstrap and
  absence of insecure TLS options.
- Native Alpine reproduction confirmed pip 20.3.4 fails certificate validation
  and pip 26.0.1 completes the emitter dependency installation.

## Validation Skipped

- Full Docker build and image smoke testing.
- ARM64/ARMv6 multi-platform publication.
- Automated tests because Docker behavior is outside the allowed domain-test
  boundary.

## QA And Code Review

- QA skipped by `$super-agent`.
- Independent code review skipped by `$super-agent`.

## Documentation Updates

- Updated README and AGENTS.

## Staging, Commit, And Push Status

- The complete accepted set is staged, committed on
  `fix/spec-011-forgejo-pip-tls`, and pushed to the matching origin branch by
  this invocation.

## Residual Risk

- Delivery remains DRAFT until a new image is built with dependency resolution
  for both target platforms, published, pulled, and smoke-tested with pigpio on
  pi11.
- The pinned pip bootstrap corrects the observed client trust-store failure but
  does not replace operator validation of the certificate chain served by
  Forgejo.
