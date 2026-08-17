#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Missing environment file: ${ENV_FILE}"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

DEBUG=""
PLATFORMS=""
PUSH_OPTION=""
FORCE_OPTION=""
RELEASE_TAG=""
REGISTRY_PREFIX="${DOCKER_REGISTRY_URI:-}"
CACHE_FROM_VALUE=""
CACHE_TO_VALUE=""

usage_error() {
  echo "$1"
  exit 1
}

require_value() {
  if [ "$#" -lt 2 ] || [ -z "${2:-}" ] || [[ "${2:-}" == --* ]]; then
    usage_error "Error: Missing value for option ${1}"
  fi
}

is_valid_platform() {
  [[ "$1" =~ ^[a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9._-]*(/[a-z0-9][a-z0-9._-]*)?(,[a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9._-]*(/[a-z0-9][a-z0-9._-]*)?)*$ ]]
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --debug)
      shift
      DEBUG="--progress=plain"
      ;;
    --platform)
      require_value "$1" "${2-}"
      shift
      PLATFORMS="$1"
      if ! is_valid_platform "${PLATFORMS}"; then
        usage_error "Error: Invalid platform expression: ${PLATFORMS}"
      fi
      shift
      ;;
    --push)
      shift
      PUSH_OPTION="--push"
      ;;
    --force)
      shift
      FORCE_OPTION="--no-cache"
      ;;
    --release)
      require_value "$1" "${2-}"
      shift
      RELEASE_TAG="$1"
      shift
      ;;
    --registry-prefix)
      require_value "$1" "${2-}"
      shift
      REGISTRY_PREFIX="$1"
      shift
      ;;
    --cache-from)
      require_value "$1" "${2-}"
      shift
      CACHE_FROM_VALUE="$1"
      shift
      ;;
    --cache-to)
      require_value "$1" "${2-}"
      shift
      CACHE_TO_VALUE="$1"
      shift
      ;;
    --*)
      usage_error "Error: Unknown option: ${1}"
      ;;
    *)
      usage_error "Error: Unknown positional argument: ${1}"
      ;;
  esac
done

if [ -z "${RELEASE_TAG}" ]; then
  usage_error "Error: Release tag is required. Please provide it using --release parameter."
fi

if [ -z "${REGISTRY_PREFIX}" ]; then
  usage_error "Error: Missing registry prefix. Set DOCKER_REGISTRY_URI in docker/.env or pass --registry-prefix."
fi

if [ -z "${BASE_IMAGE_VERSION}" ] || [ -z "${BASE_BUILD_IMAGE_VERSION}" ]; then
  usage_error "Error: Required build values missing in docker/.env: BASE_IMAGE_VERSION, BASE_BUILD_IMAGE_VERSION."
fi

if [ -n "${PLATFORMS}" ] && ! is_valid_platform "${PLATFORMS}"; then
  usage_error "Error: Invalid platform expression: ${PLATFORMS}"
fi

if ! [[ "${RELEASE_TAG}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]]; then
  usage_error "Error: Invalid release tag: ${RELEASE_TAG}"
fi

if ! [[ "${REGISTRY_PREFIX}" =~ ^[A-Za-z0-9./:-]+$ ]]; then
  usage_error "Error: Invalid registry prefix: ${REGISTRY_PREFIX}"
fi

IMAGE_TAG="${REGISTRY_PREFIX}/device-integration-api:${RELEASE_TAG}-node${BASE_IMAGE_VERSION}"
LATEST_TAG="${REGISTRY_PREFIX}/device-integration-api:latest-node${BASE_IMAGE_VERSION}"

BUILD_CMD=(docker buildx build)

if [ -n "${DEBUG}" ]; then
  BUILD_CMD+=("${DEBUG}")
fi

if [ -n "${FORCE_OPTION}" ]; then
  BUILD_CMD+=("${FORCE_OPTION}")
fi

if [ -n "${PLATFORMS}" ]; then
  BUILD_CMD+=(--platform "${PLATFORMS}")
fi

if [ -n "${CACHE_FROM_VALUE}" ]; then
  BUILD_CMD+=(--cache-from "${CACHE_FROM_VALUE}")
fi

if [ -n "${CACHE_TO_VALUE}" ]; then
  BUILD_CMD+=(--cache-to "${CACHE_TO_VALUE}")
fi

BUILD_CMD+=(
  -t "${IMAGE_TAG}"
  -t "${LATEST_TAG}"
  -f -
)

if [ -n "${PUSH_OPTION}" ]; then
  BUILD_CMD+=("${PUSH_OPTION}")
fi

BUILD_CMD+=("${REPOSITORY_ROOT}")

sed -e "s/BASE_IMAGE_VERSION/${BASE_IMAGE_VERSION}/g" \
    -e "s/BASE_BUILD_IMAGE_VERSION/${BASE_BUILD_IMAGE_VERSION}/g" \
    "${SCRIPT_DIR}/Dockerfile" | \
  "${BUILD_CMD[@]}"
