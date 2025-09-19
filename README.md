# Device Integration API

Device Integration API is a Node.js server project written in TypeScript that provides integration with devices such as ventilators. It contains modular components for interacting with hardware, managing configurations, and running operations through a RESTful API.

## Features
- Modular architecture.
- Written using modern TypeScript and Express.js.
- Supports device-specific configurations (e.g., ventilators).
- REST API for external integrations.
- Shell command execution for device operations.
- Dockerized deployment for containerized environments.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Scripts](#scripts)
5. [Building and Running with Docker](#building-and-running-with-docker)
6. [License](#license)

---

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

2. Run the Docker container:
   ```bash
   docker run -p 3000:3000 -d device-integration-api:<RELEASE_TAG>
   ```

3. Access the application in your browser:
   ```
   http://localhost:3000
   ```

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
If you'd like more details added, feel free to ask!