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
6. [Building and Running with Docker](#building-and-running-with-docker)
7. [License](#license)

---

## Architecture and Spec Workflow
- Source modules are separated under `src` by package (`common`, `fan`, and future device packages).
- All implementation changes are spec-driven and must be approved before coding.
- Specs are stored under `specs/`.
- Agent and architecture conventions are tracked in `AGENTS.md`.
- API routes are versioned under `/api/v1`.

## Prerequisites
- Node.js >= 19
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
   npm install
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
- `lint`: Lints the TypeScript and JavaScript files using ESLint.
- `format`: Formats the code using Prettier.

---
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

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
