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
    case "$SHADE_PACKAGE_NAME" in ''|*PLACEHOLDER*|REPLACE_WITH*) echo >&2 'SHADE_PACKAGE_NAME must be a real pinned distribution, not a placeholder'; exit 1;; esac; \
    case "$SHADE_PACKAGE_NAME" in *[!A-Za-z0-9._-]*) echo >&2 'Invalid SHADE_PACKAGE_NAME'; exit 1;; esac; \
    echo "$SHADE_PACKAGE_VERSION" | grep -Eq '^[0-9]+(\.[0-9]+)*(a[0-9]+|b[0-9]+|rc[0-9]+)?(\.post[0-9]+)?(\.dev[0-9]+)?$' || { echo >&2 'SHADE_PACKAGE_VERSION must be an exact release version'; exit 1; }; \
    [ "$SHADE_PACKAGE_NAME" = rpi-cc1101-transciever ] && [ "$SHADE_PACKAGE_VERSION" = 1.0.0b2 ] || { echo >&2 'Unsupported shade release: update the reviewed wheel hash and package contract first'; exit 1; }; \
    apk add --no-cache su-exec scanelf xz; \
    apk add --no-cache --virtual .python-build-deps build-base linux-headers pkgconf openssl-dev zlib-dev bzip2-dev xz-dev readline-dev sqlite-dev libffi-dev gdbm-dev ncurses-dev expat-dev swig; \
    mkdir -p /tmp/cpython /opt/python; \
    wget -q https://www.python.org/ftp/python/3.11.18/Python-3.11.18.tar.xz -O /tmp/Python-3.11.18.tar.xz; \
    echo '9120e0a653868f6e3698d36cdd99e5a58903ec9469e448f21d98f7b16d8fa290  /tmp/Python-3.11.18.tar.xz' | sha256sum -c -; \
    tar -xJf /tmp/Python-3.11.18.tar.xz -C /tmp/cpython --strip-components=1; \
    export LD_LIBRARY_PATH=/opt/python/lib; \
    cd /tmp/cpython; ./configure --prefix=/opt/python --enable-shared --with-ensurepip=install; \
    make -j2; make altinstall; \
    ln -sf /opt/python/bin/python3.11 /opt/python/bin/python3; \
    ln -sf /opt/python/bin/pip3.11 /opt/python/bin/pip3; \
    export PATH=/opt/python/bin:$PATH LD_LIBRARY_PATH=/opt/python/lib; \
    python3 -m pip install --upgrade 'pip==26.0.1'; \
    python3 -m pip install pigpio; \
    python3 -m pip install --index-url https://pypi.org/simple 'cc1101==3.0.0' rpi-lgpio spidev; \
    python3 -m pip download --no-deps --only-binary=:all: --index-url https://forgejo.alexlab.nl/api/packages/public/pypi/simple --dest /tmp "${SHADE_PACKAGE_NAME}==${SHADE_PACKAGE_VERSION}"; \
    echo '4772ee209da3f9125be33c355df77589ff48bef176f9efb4b64ffe0a30c210c6  /tmp/rpi_cc1101_transciever-1.0.0b2-py3-none-any.whl' | sha256sum -c -; \
    python3 -m pip install --no-deps /tmp/rpi_cc1101_transciever-1.0.0b2-py3-none-any.whl; \
    python3 -m pip install --index-url https://forgejo.alexlab.nl/api/packages/public/pypi/simple --extra-index-url https://pypi.org/simple "rpi-groove-ir-emitter==${IR_EMITTER_VERSION}"; \
    python3 -m pip check; \
    mkdir -p /usr/local/bin; ln -sf /opt/python/bin/python3 /usr/local/bin/python3; ln -sf /opt/python/bin/python3 /usr/local/bin/python; \
    for so in $(scanelf -R --needed --nobanner --format '%n#p' /opt/python/bin/python3.11 /opt/python/lib 2>/dev/null | tr ',' '\n' | sort -u); do case "$so" in libpython3.11.so.1.0) ;; *) apk add --no-cache "so:$so" ;; esac; done; \
    SHADE_EXPECTED_VERSION="$SHADE_PACKAGE_VERSION" python3 -c 'import os,ssl,ctypes,sqlite3,cc1101_transceiver,cc1101,spidev,RPi.GPIO,lgpio,importlib.metadata as m; d=m.distribution("rpi-cc1101-transciever"); assert d.version==os.environ["SHADE_EXPECTED_VERSION"]; assert {"cc1101==3.0.0","rpi-lgpio","spidev"}.issubset(set(d.requires or [])); print("CPython", __import__("sys").version)'; \
    cc1101-transceiver --help >/dev/null; cc1101-transceiver emitter send --help >/dev/null; \
    python3 -m pip check; \
    apk del .python-build-deps; rm -rf /tmp/cpython /tmp/Python-3.11.18.tar.xz /root/.cache/pip; cd /app; \
    python3 -c 'import ssl,ctypes,sqlite3,ir_emitter,cc1101_transceiver,cc1101,spidev,RPi.GPIO,lgpio,importlib.metadata as m; print(m.version("rpi-cc1101-transciever"))'; \
    python3 -m ir_emitter --help >/dev/null; \
    su-exec node env PATH=/opt/python/bin:$PATH LD_LIBRARY_PATH=/opt/python/lib python3 -c 'import ssl,ctypes,sqlite3,ir_emitter,cc1101_transceiver,cc1101,spidev,RPi.GPIO,lgpio,importlib.metadata as m; print(m.version("rpi-cc1101-transciever"))'; \
    su-exec node env PATH=/opt/python/bin:$PATH LD_LIBRARY_PATH=/opt/python/lib python3 -m ir_emitter --help >/dev/null; \
    su-exec node env PATH=/opt/python/bin:$PATH LD_LIBRARY_PATH=/opt/python/lib cc1101-transceiver --help >/dev/null; \
    su-exec node env PATH=/opt/python/bin:$PATH LD_LIBRARY_PATH=/opt/python/lib cc1101-transceiver emitter send --help >/dev/null

ENV PATH="/opt/python/bin:${PATH}" \
    LD_LIBRARY_PATH="/opt/python/lib"
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    mkdir -p /app/state && \
    chown -R node:node /app/state

EXPOSE 3000
VOLUME ["/app/state"]

ENV NODE_ENV=production
USER node

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
