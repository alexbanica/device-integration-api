import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FanFileStateStore } from '../../../src/fan/infrastructures/FanFileStateStore';
import { FanStateDto } from '../../../src/fan/dtos/FanStateDto';
import { FanStatePersistenceError } from '../../../src/fan/services/FanStatePersistenceError';
import { FanFileStateStoreFileSystemInterface } from '../../../src/fan/infrastructures/FanFileStateStoreFileSystemInterface';

async function createTemporaryStatePath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'fan-state-store-'));
  return join(directory, 'nested', 'fan-state.json');
}

function createOnState(): FanStateDto {
  const state = new FanStateDto();
  state.isOn = true;
  state.speed = 2;
  state.isRotating = true;
  return state;
}

test('missing file creates parent directory, writes default state, and loads it', async () => {
  const stateFilePath = await createTemporaryStatePath();
  const store = new FanFileStateStore(stateFilePath);

  const state = await store.load();
  const saved = await readFile(stateFilePath, 'utf8');

  assert.deepEqual(state, new FanStateDto());
  assert.equal(
    saved,
    '{\n  "isOn": false,\n  "speed": 0,\n  "isRotating": false\n}\n',
  );
});

test('valid state file loads successfully', async () => {
  const stateFilePath = await createTemporaryStatePath();
  const store = new FanFileStateStore(stateFilePath);
  await store.save(createOnState());

  const state = await store.load();

  assert.deepEqual(state, createOnState());
});

test('malformed JSON fails load with persistence error', async () => {
  const stateFilePath = await createTemporaryStatePath();
  const store = new FanFileStateStore(stateFilePath);
  await store.load();
  await writeFile(stateFilePath, '{', 'utf8');

  await assert.rejects(() => store.load(), FanStatePersistenceError);
});

test('invalid state invariants fail load with persistence error', async () => {
  const stateFilePath = await createTemporaryStatePath();
  const store = new FanFileStateStore(stateFilePath);
  await store.load();
  await writeFile(
    stateFilePath,
    JSON.stringify({ isOn: false, speed: 1, isRotating: false }),
    'utf8',
  );

  await assert.rejects(() => store.load(), FanStatePersistenceError);
});

test('state with extra persisted fields fails load with persistence error', async () => {
  const stateFilePath = await createTemporaryStatePath();
  const store = new FanFileStateStore(stateFilePath);
  await store.load();
  await writeFile(
    stateFilePath,
    JSON.stringify({
      isOn: true,
      speed: 1,
      isRotating: false,
      updatedAt: '2026-06-05T00:00:00.000Z',
    }),
    'utf8',
  );

  await assert.rejects(() => store.load(), FanStatePersistenceError);
});

test('save writes stable JSON containing only persisted behavior fields', async () => {
  const stateFilePath = await createTemporaryStatePath();
  const store = new FanFileStateStore(stateFilePath);
  const state = createOnState() as FanStateDto & { commandHistory?: string[] };
  state.commandHistory = ['start'];

  await store.save(state);

  assert.equal(
    await readFile(stateFilePath, 'utf8'),
    '{\n  "isOn": true,\n  "speed": 2,\n  "isRotating": true\n}\n',
  );
});

test('save writes to a temporary file in the same directory before rename', async () => {
  const calls: string[] = [];
  const stateFilePath = '/tmp/fan-state-test/state/fan-state.json';
  const fileSystem: FanFileStateStoreFileSystemInterface = {
    async mkdir(path: string): Promise<void> {
      calls.push(`mkdir:${path}`);
    },
    async readFile(): Promise<string> {
      throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    },
    async writeFile(path: string): Promise<void> {
      calls.push(`write:${path}`);
    },
    async rename(from: string, to: string): Promise<void> {
      calls.push(`rename:${from}:${to}`);
    },
  };
  const store = new FanFileStateStore(stateFilePath, fileSystem, () => 'fixed');

  await store.save(createOnState());

  assert.deepEqual(calls, [
    'mkdir:/tmp/fan-state-test/state',
    'write:/tmp/fan-state-test/state/.fan-state.json.fixed.tmp',
    'rename:/tmp/fan-state-test/state/.fan-state.json.fixed.tmp:/tmp/fan-state-test/state/fan-state.json',
  ]);
});
