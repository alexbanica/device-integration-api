FROM alpine:3.15 AS downloader
ARG GITHUB_REPO
ARG RELEASE_TAG

RUN apk add --no-cache curl unzip

RUN --mount=type=secret,id=GITHUB_AUTH \
    set -eux; \
    auth="$(cat /run/secrets/GITHUB_AUTH)"; \
    curl -o src.zip -fL \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $auth" \
            "${GITHUB_REPO}/zipball/${RELEASE_TAG}"; \
    unzip src.zip -d /tmp && \
    mv /tmp/alexbanica-* /tmp/src && \
    rm src.zip

FROM node:BASE_BUILD_IMAGE_VERSION AS builder
WORKDIR /app
COPY --from=downloader /tmp/src ./

# Builder needs dev dependencies (e.g. typescript) to run npm build
RUN npm install --silent
RUN npm run build

FROM node:BASE_IMAGE_VERSION AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY docker-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production
USER node

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
