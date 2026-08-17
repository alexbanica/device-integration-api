import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const repositoryRoot = process.cwd();
const buildScript = join(repositoryRoot, 'docker', 'build.sh');

interface Invocation {
  status: number | null;
  stdout: string;
  stderr: string;
  dockerArgs: string[];
}

function invokeBuild(
  args: readonly string[],
  callerDirectory?: string,
): Invocation {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'build-script-test-'));
  const dockerArgumentsFile = join(temporaryDirectory, 'docker-args');
  const fakeDocker = join(temporaryDirectory, 'docker');
  writeFileSync(
    fakeDocker,
    '#!/bin/sh\nprintf \'%s\\n\' "$@" > "$DOCKER_ARGS_FILE"\ncat >/dev/null\n',
  );
  chmodSync(fakeDocker, 0o755);
  const result = spawnSync('bash', [buildScript, ...args], {
    cwd: callerDirectory ?? repositoryRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${temporaryDirectory}:${process.env.PATH ?? ''}`,
      DOCKER_ARGS_FILE: dockerArgumentsFile,
    },
  });
  let dockerArgs: string[] = [];
  try {
    dockerArgs = readFileSync(dockerArgumentsFile, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    /* validation failures intentionally do not invoke Docker */
  }
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    dockerArgs,
  };
}

test('resolves Docker inputs from the script, independent of caller directory', () => {
  const result = invokeBuild(
    ['--release', 'v1.2.3'],
    mkdtempSync(join(tmpdir(), 'build-caller-test-')),
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.dockerArgs.at(-1), repositoryRoot);
});

test('uses local defaults without GitHub source or secret inputs', () => {
  const result = invokeBuild(['--release', 'v1.2.3']);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(
    result.dockerArgs.includes(
      'registry.pi.home:5000/device-integration-api:v1.2.3-node19.2.0-alpine3.15',
    ),
  );
  assert.ok(
    result.dockerArgs.includes(
      'registry.pi.home:5000/device-integration-api:latest-node19.2.0-alpine3.15',
    ),
  );
  assert.doesNotMatch(
    result.dockerArgs.join(' '),
    /GITHUB_REPO|GITHUB_AUTH|SOURCE_REVISION|--secret/,
  );
});

test('propagates the exact ordered ARM64 and ARMv6 platform set once', () => {
  const result = invokeBuild([
    '--release',
    'v1.2.3',
    '--platform',
    'linux/arm64,linux/arm/v6',
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.dockerArgs.filter((arg) => arg === 'linux/arm64,linux/arm/v6')
      .length,
    1,
  );
  assert.equal(
    result.dockerArgs[result.dockerArgs.indexOf('--platform') + 1],
    'linux/arm64,linux/arm/v6',
  );
});

test('accepts a valid local platform and passes it through', () => {
  const result = invokeBuild([
    '--release',
    'v1.2.3',
    '--platform',
    'linux/amd64',
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.dockerArgs[result.dockerArgs.indexOf('--platform') + 1],
    'linux/amd64',
  );
});

test('propagates push, force, and Buildx cache options', () => {
  const result = invokeBuild([
    '--release',
    'v1.2.3',
    '--push',
    '--force',
    '--cache-from',
    'type=gha,scope=device-integration-api-linux-arm64-armv6',
    '--cache-to',
    'type=gha,mode=max,scope=device-integration-api-linux-arm64-armv6',
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.dockerArgs.includes('--push'));
  assert.ok(result.dockerArgs.includes('--no-cache'));
  assert.ok(
    result.dockerArgs.includes(
      'type=gha,scope=device-integration-api-linux-arm64-armv6',
    ),
  );
  assert.ok(
    result.dockerArgs.includes(
      'type=gha,mode=max,scope=device-integration-api-linux-arm64-armv6',
    ),
  );
});

for (const [name, args, missingOption] of [
  ['missing release value', ['--release'], '--release'],
  [
    'missing platform value',
    ['--release', 'v1.2.3', '--platform'],
    '--platform',
  ],
  [
    'missing registry prefix value',
    ['--release', 'v1.2.3', '--registry-prefix'],
    '--registry-prefix',
  ],
  [
    'missing cache-from value',
    ['--release', 'v1.2.3', '--cache-from'],
    '--cache-from',
  ],
  [
    'missing cache-to value',
    ['--release', 'v1.2.3', '--cache-to'],
    '--cache-to',
  ],
  [
    'removed source revision option',
    ['--release', 'v1.2.3', '--source-revision', 'abc'],
  ],
  [
    'removed secret file option',
    ['--release', 'v1.2.3', '--secret-file', '/tmp/auth'],
  ],
  ['unknown option', ['--release', 'v1.2.3', '--not-an-option']],
  ['invalid release tag', ['--release', 'bad tag']],
  [
    'invalid platform expression',
    ['--release', 'v1.2.3', '--platform', 'not-a-platform'],
  ],
] as const) {
  test(`rejects ${name} before fake Docker invocation`, () => {
    const result = invokeBuild(args);
    assert.notEqual(result.status, 0);
    assert.deepEqual(result.dockerArgs, []);
    if (missingOption) {
      assert.match(
        `${result.stdout}${result.stderr}`,
        new RegExp(`Error: Missing value for option ${missingOption}`),
      );
    }
  });
}
