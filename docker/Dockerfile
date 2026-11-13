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

# The revision below simulates Zero W board metadata only for hardware-free shade checks; it does not prove Pi compatibility.
RUN set -eu; \
    case "$SHADE_PACKAGE_NAME" in ''|*PLACEHOLDER*|REPLACE_WITH*) echo >&2 'SHADE_PACKAGE_NAME must be a real pinned distribution, not a placeholder'; exit 1;; esac; \
    case "$SHADE_PACKAGE_NAME" in *[!A-Za-z0-9._-]*) echo >&2 'Invalid SHADE_PACKAGE_NAME'; exit 1;; esac; \
    echo "$SHADE_PACKAGE_VERSION" | grep -Eq '^[0-9]+(\.[0-9]+)*(a[0-9]+|b[0-9]+|rc[0-9]+)?(\.post[0-9]+)?(\.dev[0-9]+)?$' || { echo >&2 'SHADE_PACKAGE_VERSION must be an exact release version'; exit 1; }; \
    [ "$SHADE_PACKAGE_NAME" = rpi-cc1101-transciever ] && [ "$SHADE_PACKAGE_VERSION" = 1.0.0b2 ] || { echo >&2 'Unsupported shade release: update the reviewed wheel hash and package contract first'; exit 1; }; \
    apk add --no-cache su-exec python3 py3-pip; \
    apk add --no-cache --virtual .shade-build-deps build-base linux-headers python3-dev swig curl; \
    python3 -c 'import sys; assert sys.version_info >= (3, 10), sys.version'; \
    python3 -m venv /opt/ir-venv; \
    python3 -m venv /opt/shade-venv; \
    curl -fsSL https://github.com/joan2937/lg/archive/refs/tags/v0.2.2.tar.gz -o /tmp/lgpio-v0.2.2.tar.gz; \
    echo 'b08d8569d6dc8fa91a42ba1e37f620fdcb19d6bf2330e4b7d7301431ddbe124c  /tmp/lgpio-v0.2.2.tar.gz' | sha256sum -c -; \
    mkdir -p /tmp/lgpio; tar -xzf /tmp/lgpio-v0.2.2.tar.gz -C /tmp/lgpio --strip-components=1; \
    cd /tmp/lgpio; make -j2 lib; \
    install -m 0755 liblgpio.so.1 /usr/lib/liblgpio.so.1; \
    ln -s liblgpio.so.1 /usr/lib/liblgpio.so; \
    cd /app; \
    /opt/ir-venv/bin/python3 -m pip install --upgrade 'pip==26.0.1'; \
    /opt/shade-venv/bin/python3 -m pip install --upgrade 'pip==26.0.1'; \
    /opt/ir-venv/bin/python3 -m pip install pigpio; \
    /opt/ir-venv/bin/python3 -m pip install --index-url https://forgejo.alexlab.nl/api/packages/public/pypi/simple --extra-index-url https://pypi.org/simple "rpi-groove-ir-emitter==${IR_EMITTER_VERSION}"; \
    /opt/shade-venv/bin/python3 -m pip install --index-url https://pypi.org/simple 'cc1101==3.0.0' rpi-lgpio 'lgpio==0.2.2.0' spidev; \
    /opt/shade-venv/bin/python3 -m pip download --no-deps --only-binary=:all: --index-url https://forgejo.alexlab.nl/api/packages/public/pypi/simple --dest /tmp "${SHADE_PACKAGE_NAME}==${SHADE_PACKAGE_VERSION}"; \
    echo '4772ee209da3f9125be33c355df77589ff48bef176f9efb4b64ffe0a30c210c6  /tmp/rpi_cc1101_transciever-1.0.0b2-py3-none-any.whl' | sha256sum -c -; \
    /opt/shade-venv/bin/python3 -m pip install --no-deps /tmp/rpi_cc1101_transciever-1.0.0b2-py3-none-any.whl; \
    apk del .shade-build-deps; rm -rf /root/.cache/pip /tmp/rpi_cc1101_transciever-1.0.0b2-py3-none-any.whl /tmp/lgpio /tmp/lgpio-v0.2.2.tar.gz; cd /app; \
    export PATH=/opt/ir-venv/bin:/opt/shade-venv/bin:$PATH; \
    shade_check_dir="$(su-exec node mktemp -d /tmp/shade-check.XXXXXX)"; \
    cd "$shade_check_dir"; \
    test "$(command -v python3)" = /opt/ir-venv/bin/python3; \
    test "$(command -v cc1101-transceiver)" = /opt/shade-venv/bin/cc1101-transceiver; \
    head -n 1 /opt/shade-venv/bin/cc1101-transceiver | grep -Fx '#!/opt/shade-venv/bin/python3'; \
    su-exec node sh -c 'test "$(command -v python3)" = /opt/ir-venv/bin/python3 && test "$(command -v cc1101-transceiver)" = /opt/shade-venv/bin/cc1101-transceiver'; \
    su-exec node env RPI_LGPIO_REVISION=9000c1 SHADE_EXPECTED_VERSION="$SHADE_PACKAGE_VERSION" /opt/shade-venv/bin/python3 -c 'import os,sys,ssl,ctypes,sqlite3,cc1101_transceiver,cc1101,spidev,RPi.GPIO,lgpio,importlib.metadata as m,importlib.util; assert sys.executable=="/opt/shade-venv/bin/python3", sys.executable; assert sys.version_info >= (3, 10), sys.version; d=m.distribution("rpi-cc1101-transciever"); assert d.version==os.environ["SHADE_EXPECTED_VERSION"]; assert {"cc1101==3.0.0","rpi-lgpio","spidev"}.issubset(set(d.requires or [])); assert importlib.util.find_spec("Jetson") is None; print("Shade Python", sys.version, "shade", d.version)'; \
    su-exec node env IR_EMITTER_VERSION="$IR_EMITTER_VERSION" python3 -c 'import os,sys,ir_emitter,pigpio,importlib.metadata as m; assert sys.executable=="/opt/ir-venv/bin/python3", sys.executable; assert m.version("rpi-groove-ir-emitter")==os.environ["IR_EMITTER_VERSION"]; print("IR Python", sys.version, "emitter", m.version("rpi-groove-ir-emitter"))'; \
    su-exec node /opt/shade-venv/bin/python3 -m pip check; \
    su-exec node /opt/ir-venv/bin/python3 -m pip check; \
    su-exec node python3 -m ir_emitter --help >/dev/null; \
    su-exec node env RPI_LGPIO_REVISION=9000c1 cc1101-transceiver --help >/dev/null; \
    su-exec node env RPI_LGPIO_REVISION=9000c1 cc1101-transceiver emitter send --help >/dev/null; \
    cd /app; rm -rf "$shade_check_dir"

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
