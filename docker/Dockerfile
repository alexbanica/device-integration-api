FROM node:BASE_BUILD_IMAGE_VERSION AS builder
WORKDIR /app
COPY package*.json ./

RUN npm ci --silent
COPY . .
RUN npm run build

FROM node:BASE_IMAGE_VERSION AS runtime

ARG IR_EMITTER_VERSION=1.0.1
ARG SHADE_PACKAGE_NAME=rpi-cc1101-transciever
ARG SHADE_PACKAGE_VERSION=1.0.0b2

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY docker/docker-entrypoint.sh /usr/local/bin/

RUN set -eu; \
    apk add --no-cache python3 py3-pip; \
    apk add --no-cache --virtual .shade-build-deps build-base linux-headers python3-dev swig curl; \
    python3 -m venv /opt/ir-venv; \
    python3 -m venv /opt/shade-venv; \
    curl -fsSL https://github.com/joan2937/lg/archive/refs/tags/v0.2.2.tar.gz -o /tmp/lgpio-v0.2.2.tar.gz; \
    mkdir -p /tmp/lgpio; tar -xzf /tmp/lgpio-v0.2.2.tar.gz -C /tmp/lgpio --strip-components=1; \
    cd /tmp/lgpio; make -j2 lib; \
    install -m 0755 liblgpio.so.1 /usr/lib/liblgpio.so.1; \
    ln -s liblgpio.so.1 /usr/lib/liblgpio.so; \
    cd /app; \
    /opt/ir-venv/bin/python3 -m pip install --upgrade 'pip==26.0.1'; \
    /opt/shade-venv/bin/python3 -m pip install --upgrade 'pip==26.0.1'; \
    /opt/ir-venv/bin/python3 -m pip install pigpio; \
    /opt/ir-venv/bin/python3 -m pip install --index-url https://forgejo.alexlab.nl/api/packages/public/pypi/simple --extra-index-url https://pypi.org/simple "rpi-groove-ir-emitter==${IR_EMITTER_VERSION}"; \
    /opt/shade-venv/bin/python3 -m pip install --index-url https://forgejo.alexlab.nl/api/packages/public/pypi/simple --extra-index-url https://pypi.org/simple 'lgpio==0.2.2.0' "${SHADE_PACKAGE_NAME}==${SHADE_PACKAGE_VERSION}"; \
    apk del .shade-build-deps; \
    rm -rf /root/.cache/pip /tmp/lgpio /tmp/lgpio-v0.2.2.tar.gz

ENV PATH="/opt/ir-venv/bin:/opt/shade-venv/bin:${PATH}"
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    mkdir -p /app/state && \
    chown -R node:node /app/state

EXPOSE 3000
VOLUME ["/app/state"]

ENV NODE_ENV=production
USER node

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
