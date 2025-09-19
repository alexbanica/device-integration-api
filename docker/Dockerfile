FROM alpine:3.15 AS pigpio-builder
# Install build tools and all dependencies needed for compilation
RUN apk add --no-cache \
    git \
    build-base \
    python3-dev

RUN echo -e '#!/bin/sh\nexit 0' > /usr/local/bin/ldconfig && chmod +x /usr/local/bin/ldconfig

# Download the pigpio source and compile it
RUN git clone https://github.com/joan2937/pigpio.git /tmp/pigpio && \
    cd /tmp/pigpio && \
    make && \
    make install || true && \
    ln -sf /usr/local/lib/libpigpio.so.1 /usr/lib/libpigpio.so && \
    ln -sf /usr/local/lib/libpigpiod_if.so.1 /usr/lib/libpigpiod_if.so && \
    ln -sf /usr/local/lib/libpigpiod_if2.so.1 /usr/lib/libpigpiod_if2.so


FROM alpine:3.15 AS downloader
ARG GITHUB_REPO
ARG RELEASE_TAG

# Install required tools
RUN apk add --no-cache curl unzip

# Download and extract
RUN --mount=type=secret,id=GITHUB_AUTH \
    set -eux; \
    auth="$(cat /run/secrets/GITHUB_AUTH)"; \
    curl -o src.zip -fL \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $auth" \
            "${GITHUB_REPO}/zipball/${RELEASE_TAG}"; \
    \
    unzip src.zip -d /tmp && \
    mv /tmp/alexbanica-* /tmp/src && \
    rm src.zip

FROM node:BASE_BUILD_IMAGE_VERSION AS builder
WORKDIR /app
COPY --from=downloader /tmp/src ./

RUN npm install --production --silent nodemon
RUN npm run build

FROM node:BASE_IMAGE_VERSION AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Install Python3 and pip for runtime environment
RUN apk add --no-cache python3 py3-pip && \
    pip3 install pigpio

# Copy pigpio binaries from the Debian build stage
COPY --from=pigpio-builder /usr/local/bin/pigpiod /usr/bin/pigpiod
COPY --from=pigpio-builder /usr/local/lib/libpigpio* /usr/lib/
COPY --from=pigpio-builder /usr/local/include/pigpio.h /usr/include/

# Ensure necessary permissions for Pigpio
RUN chmod +x /usr/bin/pigpiod

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["sh", "-c", "pigpiod && npm start"]
