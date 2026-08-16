import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dockerDirectory = resolve(__dirname, '../../../docker');
const dockerfile = readFileSync(resolve(dockerDirectory, 'Dockerfile'), 'utf8');

test('downloads the immutable source revision rather than the image tag', () => {
  assert.match(dockerfile, /^ARG SOURCE_REVISION$/m);
  assert.match(dockerfile, /\$\{GITHUB_REPO\}\/zipball\/\$\{SOURCE_REVISION\}/);
  assert.doesNotMatch(dockerfile, /zipball\/\$\{RELEASE_TAG\}/);
});

test('installs the downloaded source from its lockfile before building', () => {
  assert.match(dockerfile, /^RUN npm ci --silent$/m);
  assert.doesNotMatch(dockerfile, /^RUN npm install(?:\s|$)/m);
  assert.match(dockerfile, /^RUN npm run build$/m);
});

test('preserves the downloader, builder, and runtime image contract', () => {
  assert.match(dockerfile, /^FROM alpine:3\.15 AS downloader$/m);
  assert.match(dockerfile, /^FROM node:BASE_BUILD_IMAGE_VERSION AS builder$/m);
  assert.match(dockerfile, /^FROM node:BASE_IMAGE_VERSION AS runtime$/m);
  assert.match(dockerfile, /^WORKDIR \/app$/m);
  assert.match(dockerfile, /COPY --from=builder \/app\/dist \.\/dist/);
  assert.match(dockerfile, /COPY --from=builder \/app\/node_modules \.\/node_modules/);
  assert.match(dockerfile, /COPY --from=builder \/app\/package\*\.json \.\//);
  assert.match(dockerfile, /COPY docker-entrypoint\.sh \/usr\/local\/bin\//);
  assert.match(dockerfile, /EXPOSE 3000/);
  assert.match(dockerfile, /VOLUME \["\/app\/state"\]/);
  assert.match(dockerfile, /ENV NODE_ENV=production/);
  assert.match(dockerfile, /USER node/);
  assert.match(dockerfile, /ENTRYPOINT \["\/usr\/local\/bin\/docker-entrypoint\.sh"\]/);
  assert.match(dockerfile, /CMD \["npm", "start"\]/);
});

test('uses the GitHub token only through a BuildKit secret mount', () => {
  assert.match(dockerfile, /RUN --mount=type=secret,id=GITHUB_AUTH/);
  assert.match(dockerfile, /\/run\/secrets\/GITHUB_AUTH/);
  assert.doesNotMatch(dockerfile, /ARG GITHUB_AUTH/);
  assert.doesNotMatch(dockerfile, /ENV GITHUB_AUTH/);
});

test('does not enable shell xtrace while consuming the GitHub token secret', () => {
  const secretCommand = dockerfile.match(
    /RUN --mount=type=secret,id=GITHUB_AUTH[\s\S]*?(?=\n\nFROM )/,
  )?.[0];

  assert.ok(secretCommand, 'expected the GitHub token secret-consuming RUN command');
  assert.doesNotMatch(secretCommand, /^\s*set\s+-[^;\\\n]*x(?:\s|;|$)/m);
});

test('excludes credential material from the ordinary Docker context', () => {
  const dockerignore = readFileSync(resolve(dockerDirectory, '.dockerignore'), 'utf8');

  assert.match(dockerignore, /(?:^|\n)secrets\/(?:\n|$)/);
  assert.match(dockerignore, /(?:^|\n)\.github_auth(?:\n|$)/);
  assert.match(dockerignore, /(?:^|\n)\*\.(?:key|pem|token)(?:\n|$)/);
});
