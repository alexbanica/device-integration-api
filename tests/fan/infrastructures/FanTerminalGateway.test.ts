import test from 'node:test';
import assert from 'node:assert/strict';
import { FanConfiguration } from '../../../src/fan/configurations/FanConfiguration';
import { FanTerminalGateway } from '../../../src/fan/infrastructures/FanTerminalGateway';
import { TerminalExecutorInterface } from '../../../src/common/infrastructures/TerminalExecutorInterface';

class TerminalExecutorStub implements TerminalExecutorInterface {
  public readonly executedCommands: string[] = [];
  public readonly executedWorkingDirectories: string[] = [];
  public readonly results: number[] = [];

  public async execute(
    command: string,
    workingDirectory: string,
  ): Promise<number> {
    this.executedCommands.push(command);
    this.executedWorkingDirectories.push(workingDirectory);

    if (this.results.length === 0) {
      return 0;
    }

    return this.results.shift() ?? 0;
  }
}

function buildConfiguration(standbyTimeoutMs: string = '1000') {
  return new FanConfiguration({
    FAN_SCRIPT_DIR: '/tmp',
    FAN_BASH_START: './on_off.sh',
    FAN_BASH_STOP: './stop.sh',
    FAN_BASH_ROTATE: './rotate.sh',
    FAN_BASH_SPEED: './speed.sh',
    FAN_STANDBY_TIMEOUT_MS: standbyTimeoutMs,
  });
}

test('does not execute wakeup on first command after process start', async () => {
  const terminal = new TerminalExecutorStub();
  let now = 100;
  const gateway = new FanTerminalGateway(
    terminal,
    buildConfiguration('1000'),
    () => now,
  );

  const result = await gateway.stop(true);

  assert.equal(result, true);
  assert.deepEqual(terminal.executedCommands, ['./stop.sh']);
});

test('executes wakeup when eligible command reaches timeout threshold equality', async () => {
  const terminal = new TerminalExecutorStub();
  let now = 100;
  const gateway = new FanTerminalGateway(
    terminal,
    buildConfiguration('1000'),
    () => now,
  );

  await gateway.rotate(true);
  now = 1100;

  const result = await gateway.stop(true);

  assert.equal(result, true);
  assert.deepEqual(terminal.executedCommands, [
    './rotate.sh',
    './on_off.sh',
    './stop.sh',
  ]);
});

test('does not execute wakeup when timeout is reached but command is ineligible', async () => {
  const terminal = new TerminalExecutorStub();
  let now = 100;
  const gateway = new FanTerminalGateway(
    terminal,
    buildConfiguration('1000'),
    () => now,
  );

  await gateway.rotate(true);
  now = 1100;

  const result = await gateway.stop(false);

  assert.equal(result, true);
  assert.deepEqual(terminal.executedCommands, ['./rotate.sh', './stop.sh']);
});

test('executes only rotate when rotate is ineligible after timeout', async () => {
  const terminal = new TerminalExecutorStub();
  let now = 100;
  const gateway = new FanTerminalGateway(
    terminal,
    buildConfiguration('1000'),
    () => now,
  );

  await gateway.start(false);
  now = 1100;

  const result = await gateway.rotate(false);

  assert.equal(result, true);
  assert.deepEqual(terminal.executedCommands, ['./on_off.sh', './rotate.sh']);
});

test('executes only start when start is ineligible after timeout', async () => {
  const terminal = new TerminalExecutorStub();
  let now = 100;
  const gateway = new FanTerminalGateway(
    terminal,
    buildConfiguration('1000'),
    () => now,
  );

  await gateway.rotate(true);
  now = 1100;

  const result = await gateway.start(false);

  assert.equal(result, true);
  assert.deepEqual(terminal.executedCommands, ['./rotate.sh', './on_off.sh']);
});

test('skips wakeup for consecutive eligible commands within timeout', async () => {
  const terminal = new TerminalExecutorStub();
  let now = 100;
  const gateway = new FanTerminalGateway(
    terminal,
    buildConfiguration('1000'),
    () => now,
  );

  await gateway.start(false);
  now = 500;

  const result = await gateway.rotate(true);

  assert.equal(result, true);
  assert.deepEqual(terminal.executedCommands, ['./on_off.sh', './rotate.sh']);
});

test('does not execute intended command when wakeup fails', async () => {
  const terminal = new TerminalExecutorStub();
  let now = 0;
  const gateway = new FanTerminalGateway(
    terminal,
    buildConfiguration('1000'),
    () => now,
  );

  await gateway.rotate(true);
  now = 1000;
  terminal.results.push(1);

  const result = await gateway.stop(true);

  assert.equal(result, false);
  assert.deepEqual(terminal.executedCommands, ['./rotate.sh', './on_off.sh']);
});

test('propagates intended command failure after successful wakeup', async () => {
  const terminal = new TerminalExecutorStub();
  let now = 0;
  const gateway = new FanTerminalGateway(
    terminal,
    buildConfiguration('1000'),
    () => now,
  );

  await gateway.rotate(true);
  now = 1000;
  terminal.results.push(0, 1);

  const result = await gateway.stop(true);

  assert.equal(result, false);
  assert.deepEqual(terminal.executedCommands, [
    './rotate.sh',
    './on_off.sh',
    './stop.sh',
  ]);
});

test('does not update last intended command timestamp after wakeup-only success', async () => {
  const terminal = new TerminalExecutorStub();
  let now = 0;
  const gateway = new FanTerminalGateway(
    terminal,
    buildConfiguration('1000'),
    () => now,
  );

  await gateway.rotate(true);
  now = 1000;
  terminal.results.push(0, 1, 0, 0);

  const firstResult = await gateway.stop(true);
  const secondResult = await gateway.stop(true);

  assert.equal(firstResult, false);
  assert.equal(secondResult, true);
  assert.deepEqual(terminal.executedCommands, [
    './rotate.sh',
    './on_off.sh',
    './stop.sh',
    './on_off.sh',
    './stop.sh',
  ]);
});
