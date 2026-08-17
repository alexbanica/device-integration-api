# Device Integration API

Device Integration API is a Node.js server project written in TypeScript that provides integration with devices such as fans. It contains modular components for interacting with hardware, managing configurations, and running operations through a RESTful API.

## Features

- Modular architecture.
- Written using modern TypeScript and Express.js.
- Supports device-specific configurations (e.g., fans).
- REST API for external integrations.
- Shell command execution for device operations.
- Dockerized deployment for containerized environments.

---

## Table of Contents

1. [Architecture and Spec Workflow](#architecture-and-spec-workflow)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Scripts](#scripts)
6. [CI and checks](#ci-and-checks)
7. [Docker builds](#docker-builds)
8. [Docker publication and multi-platform policy](#docker-publication-and-multi-platform-policy)
9. [Validation boundaries](#validation-boundaries)
10. [License](#license)

---

## Architecture and Spec Workflow

- Source modules are separated under `src` by package (`common`, `fan`, and future device packages).
- All implementation changes are spec-driven and must be approved before coding.
- Specs are stored under `specs/`.
- Agent and architecture conventions are tracked in `AGENTS.md`.
- API routes are versioned under `/api/v1`.

## Prerequisites

- Node.js >= 19 for local runtime. GitHub Actions CI checks use Node.js 20 (documented below).
- npm >= 9.x
- Docker (optional, for containerized deployment)

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo/device_integration_api.git
   cd device_integration_api
   ```
2. Install dependencies:

   ```bash
   npm ci
   ```

3. Create a `.env` file in the root directory and specify environment variables. (Refer to `.env` for the required variables.)
   Required fan variables:
   - `FAN_SCRIPT_DIR`
   - `FAN_BASH_START`
   - `FAN_BASH_STOP`
   - `FAN_BASH_ROTATE`
   - `FAN_BASH_SPEED`
   - `FAN_STANDBY_TIMEOUT_MS` (optional, milliseconds, integer, `>= 0`, default `60000`)
   - `FAN_STATE_FILE_PATH` (optional, default `./state/fan-state.json`)

---

## Usage

### Development

Start the server in development mode with hot reload:

```bash
npm run dev
```

### Production

1. Build the project:

   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

---

## Scripts

Key `npm` scripts included in this project:

- `dev`: Starts the development server with hot reload.
- `start`: Runs the server in production mode.
- `build`: Compiles the TypeScript code into JavaScript.
- `lint`: Non-mutating ESLint check: `eslint '{src,tests}/**/*.{js,ts}'`.
- `lint:fix`: Local autofix entry point for mutable lint fixes.
- `test`: Deterministic test run. It compiles tests with `npm run build:test`, selects every `dist-tests/tests/**/*.test.js`, fails when no files are selected, and executes all selected files through `node --test`.
- `format`: Formats the code using Prettier.
- `clean`: Removes `dist` and `dist-tests` artifacts.

Dependency installation for reproducible CI and local Docker builds requires the committed lockfile. Keep `package-lock.json` tracked and aligned with `package.json`.

## CI and checks

- GitHub workflow: `.github/workflows/ci.yml`
- Triggers:
  - Pull requests whose base branch is `main`.
  - Pushes to `main` (including PR merge commits).
- CI checks run, in order: checkout without persisted credentials, Node setup for version `20` (with npm cache), `npm ci`, `npm run lint`, and `npm test`.
- CI uses `contents: read` permission only and does not perform Docker publishes.

## Docker builds

Local defaults from `docker/.env` remain:

- `DOCKER_REGISTRY_URI=registry.pi.home:5000`
- `BASE_IMAGE_VERSION=19.2.0-alpine3.15`
- `BASE_BUILD_IMAGE_VERSION=19.2.0-alpine3.15`
- `GITHUB_REPO=https://api.github.com/repos/alexbanica/device-integration-api`
- Build options `--debug`, `--platform`, `--push`, `--force`, and `--release` are still supported.
- Running from repository root still works with:
  ```bash
  ./docker/build.sh --release <RELEASE_TAG>
  ```

### Publication-ready image tags

- Release: `forgejo.alexlab.nl/alexlab/device-integration-api:<TAG>-node19.2.0-alpine3.15`
- Rolling: `forgejo.alexlab.nl/alexlab/device-integration-api:latest-node19.2.0-alpine3.15`

`<TAG>` is the Git tag name only; the source revision used for archive download is the immutable tag event SHA.

`./docker/build.sh` publishes both tags as one multi-platform manifest index containing exactly:

- `linux/arm64`
- `linux/arm/v6`

with one Buildx invocation using:

- `--platform linux/arm64,linux/arm/v6`
- explicit cache scope `device-integration-api-linux-arm64-armv6` for both `cache-from` and `cache-to`.

### Registry and source behavior

- Registry output is enforced to `forgejo.alexlab.nl/alexlab`.
- Publish workflow validates secrets and registry prefix before login/push.
- The source tarball/revision used for build is `${{ github.sha }}`; image tags remain based on `${{ github.ref_name }}`.
- The script requires readable secret source and validates release tag, source revision, platform expression, and registry prefix before invoking Docker.

## Docker publication and multi-platform policy

- Workflow file: `.github/workflows/publish-docker-images.yml`
- Trigger: `push` on all tags.
- Secret names required:
  - `FORGEJO_REGISTRY_USERNAME`
  - `FORGEJO_REGISTRY_TOKEN`
- `FORGEJO_REGISTRY_TOKEN` must be a Forgejo token with `write:package`
  access for packages owned by `alexlab`.
- The workflow verifies:
  - exact token secrets are present and non-empty
  - tag-name grammar validity for Docker tag safety
- Publication is independent of Forgejo organization/package visibility. It does
  not query owner metadata or require a private-read check, so changing the
  owner or package between private and public does not block a correctly
  authorized publish.
- Token material for GitHub source download is written to a temporary file with mode `0600` and passed as BuildKit secret; token output is not printed in logs.
- Buildx and QEMU are validated for both `linux/arm64` and `linux/arm/v6` support before build.
- Only Forgejo registry pushes are executed; no other destination or matrix-driven alternate image list is used.
- Manifest-level output means tag digests move with each pushed tag/publish event while maintaining local `latest` roll behavior.

### Runtime validation note for ARMv6

- ARMv6-specific validation requires runnable hardware and reachable Forgejo/DNS/TLS credentials in the environment.
- This repository documentation records publication expectations; runtime smoke checks are explicitly outside deterministic local validation.

## Building and Running with Docker

1. Build the Docker image:

   ```bash
   ./docker/build.sh --release <RELEASE_TAG>
   ```

2. Ensure `pigpiod` is already running on the host and reachable on `localhost:8888`.

3. Run the Docker container with host networking and a mounted fan state volume:

   ```bash
   docker volume create device-integration-api-state
   docker run \
     --network host \
     -v device-integration-api-state:/app/state \
     -d device-integration-api:<RELEASE_TAG>
   ```

4. Access the application in your browser:
   ```
   http://localhost:3000
   ```

---

## Validation boundaries

- Local/CI behavior covered by scripts and workflow files above is deterministic.
- Live publish/runtime validation for `linux/arm64` and `linux/arm/v6` manifest inspection and actual image pull/run behavior requires trusted network access and ARMv6-capable host validation.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
