import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = resolve(__dirname, '../../..');
const dockerDirectory = resolve(repositoryRoot, 'docker');
const dockerfile = readFileSync(resolve(dockerDirectory, 'Dockerfile'), 'utf8');

test('builds the checked-out repository without GitHub downloads or secrets', () => {
  assert.match(dockerfile, /^COPY package\*\.json \.\/$/m);
  assert.match(dockerfile, /^COPY \. \.$/m);
  assert.doesNotMatch(dockerfile, /GITHUB_REPO|GITHUB_AUTH|SOURCE_REVISION/);
  assert.doesNotMatch(dockerfile, /\b(?:curl|unzip|zipball)\b/i);
  assert.doesNotMatch(dockerfile, /--mount=type=secret/i);
});

test('installs the checked-out source from its lockfile before building', () => {
  assert.match(dockerfile, /^RUN npm ci --silent$/m);
  assert.doesNotMatch(dockerfile, /^RUN npm install(?:\s|$)/m);
  assert.match(dockerfile, /^RUN npm run build$/m);
});

test('preserves the builder and runtime image contract', () => {
  assert.match(dockerfile, /^FROM node:BASE_BUILD_IMAGE_VERSION AS builder$/m);
  assert.match(dockerfile, /^FROM node:BASE_IMAGE_VERSION AS runtime$/m);
  assert.match(dockerfile, /^WORKDIR \/app$/m);
  assert.match(dockerfile, /COPY --from=builder \/app\/dist \.\/dist/);
  assert.match(
    dockerfile,
    /COPY --from=builder \/app\/node_modules \.\/node_modules/,
  );
  assert.match(dockerfile, /COPY --from=builder \/app\/package\*\.json \.\//);
  assert.match(
    dockerfile,
    /COPY docker\/docker-entrypoint\.sh \/usr\/local\/bin\//,
  );
  assert.match(dockerfile, /EXPOSE 3000/);
  assert.match(dockerfile, /VOLUME \["\/app\/state"\]/);
  assert.match(dockerfile, /ENV NODE_ENV=production/);
  assert.match(dockerfile, /USER node/);
  assert.match(
    dockerfile,
    /ENTRYPOINT \["\/usr\/local\/bin\/docker-entrypoint\.sh"\]/,
  );
  assert.match(dockerfile, /CMD \["npm", "start"\]/);
});

test('excludes credential material from the ordinary Docker context', () => {
  const dockerignore = readFileSync(
    resolve(repositoryRoot, '.dockerignore'),
    'utf8',
  );

  assert.match(dockerignore, /(?:^|\n)docker\/secrets(?:\n|$)/);
  assert.match(dockerignore, /(?:^|\n)docker\/\.env(?:\n|$)/);
  assert.match(dockerignore, /(?:^|\n)\*\.(?:key|pem|token)(?:\n|$)/);
});
