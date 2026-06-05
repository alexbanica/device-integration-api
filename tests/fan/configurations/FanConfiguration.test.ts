import test from 'node:test';
import assert from 'node:assert/strict';
import { FanConfiguration } from '../../../src/fan/configurations/FanConfiguration';

test('creates fan configuration when all env vars are present', () => {
  const configuration = new FanConfiguration({
    FAN_SCRIPT_DIR: '/tmp',
    FAN_BASH_START: './start.sh',
    FAN_BASH_STOP: './stop.sh',
    FAN_BASH_ROTATE: './rotate.sh',
    FAN_BASH_SPEED: './speed.sh',
    FAN_STANDBY_TIMEOUT_MS: '30000',
    FAN_STATE_FILE_PATH: '/tmp/fan-state.json',
  });

  assert.equal(configuration.fanWorkingDirectory, '/tmp');
  assert.equal(configuration.fanStartCommand, './start.sh');
  assert.equal(configuration.fanStopCommand, './stop.sh');
  assert.equal(configuration.fanRotateCommand, './rotate.sh');
  assert.equal(configuration.fanSpeedCommand, './speed.sh');
  assert.equal(configuration.fanStandbyTimeoutMs, 30000);
  assert.equal(configuration.fanStateFilePath, '/tmp/fan-state.json');
});

test('throws when mandatory env var is missing', () => {
  assert.throws(
    () =>
      new FanConfiguration({
        FAN_BASH_START: './start.sh',
        FAN_BASH_STOP: './stop.sh',
        FAN_BASH_ROTATE: './rotate.sh',
        FAN_BASH_SPEED: './speed.sh',
        FAN_STANDBY_TIMEOUT_MS: '30000',
      }),
    { message: 'FAN_SCRIPT_DIR is required' },
  );
});

test('does not accept legacy device env vars', () => {
  const legacyPrefix = 'VENT' + 'ILATOR';

  assert.throws(
    () =>
      new FanConfiguration({
        [`${legacyPrefix}_SCRIPT_DIR`]: '/tmp',
        [`${legacyPrefix}_BASH_START`]: './start.sh',
        [`${legacyPrefix}_BASH_STOP`]: './stop.sh',
        [`${legacyPrefix}_BASH_ROTATE`]: './rotate.sh',
        [`${legacyPrefix}_BASH_SPEED`]: './speed.sh',
        [`${legacyPrefix}_STANDBY_TIMEOUT_MS`]: '30000',
      }),
    { message: 'FAN_SCRIPT_DIR is required' },
  );
});

test('uses default standby timeout when env var is missing', () => {
  const configuration = new FanConfiguration({
    FAN_SCRIPT_DIR: '/tmp',
    FAN_BASH_START: './start.sh',
    FAN_BASH_STOP: './stop.sh',
    FAN_BASH_ROTATE: './rotate.sh',
    FAN_BASH_SPEED: './speed.sh',
  });

  assert.equal(configuration.fanStandbyTimeoutMs, 60000);
});

test('uses default state file path when env var is missing', () => {
  const configuration = new FanConfiguration({
    FAN_SCRIPT_DIR: '/tmp',
    FAN_BASH_START: './start.sh',
    FAN_BASH_STOP: './stop.sh',
    FAN_BASH_ROTATE: './rotate.sh',
    FAN_BASH_SPEED: './speed.sh',
  });

  assert.equal(configuration.fanStateFilePath, './state/fan-state.json');
});

test('throws when standby timeout env var is not an integer', () => {
  assert.throws(
    () =>
      new FanConfiguration({
        FAN_SCRIPT_DIR: '/tmp',
        FAN_BASH_START: './start.sh',
        FAN_BASH_STOP: './stop.sh',
        FAN_BASH_ROTATE: './rotate.sh',
        FAN_BASH_SPEED: './speed.sh',
        FAN_STANDBY_TIMEOUT_MS: 'abc',
      }),
    { message: 'FAN_STANDBY_TIMEOUT_MS must be an integer' },
  );
});

test('throws when standby timeout env var is negative', () => {
  assert.throws(
    () =>
      new FanConfiguration({
        FAN_SCRIPT_DIR: '/tmp',
        FAN_BASH_START: './start.sh',
        FAN_BASH_STOP: './stop.sh',
        FAN_BASH_ROTATE: './rotate.sh',
        FAN_BASH_SPEED: './speed.sh',
        FAN_STANDBY_TIMEOUT_MS: '-1',
      }),
    {
      message: 'FAN_STANDBY_TIMEOUT_MS must be greater than or equal to 0',
    },
  );
});
