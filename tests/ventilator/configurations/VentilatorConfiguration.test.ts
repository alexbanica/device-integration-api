import test from 'node:test';
import assert from 'node:assert/strict';
import { VentilatorConfiguration } from '../../../src/ventilator/configurations/VentilatorConfiguration';

test('creates ventilator configuration when all env vars are present', () => {
  const configuration = new VentilatorConfiguration({
    VENTILATOR_SCRIPT_DIR: '/tmp',
    VENTILATOR_BASH_START: './start.sh',
    VENTILATOR_BASH_STOP: './stop.sh',
    VENTILATOR_BASH_ROTATE: './rotate.sh',
    VENTILATOR_BASH_SPEED: './speed.sh',
    VENTILATOR_STANDBY_TIMEOUT_MS: '30000',
  });

  assert.equal(configuration.ventilatorWorkingDirectory, '/tmp');
  assert.equal(configuration.ventilatorStartCommand, './start.sh');
  assert.equal(configuration.ventilatorStopCommand, './stop.sh');
  assert.equal(configuration.ventilatorRotateCommand, './rotate.sh');
  assert.equal(configuration.ventilatorSpeedCommand, './speed.sh');
  assert.equal(configuration.ventilatorStandbyTimeoutMs, 30000);
});

test('throws when mandatory env var is missing', () => {
  assert.throws(
    () =>
      new VentilatorConfiguration({
        VENTILATOR_BASH_START: './start.sh',
        VENTILATOR_BASH_STOP: './stop.sh',
        VENTILATOR_BASH_ROTATE: './rotate.sh',
        VENTILATOR_BASH_SPEED: './speed.sh',
        VENTILATOR_STANDBY_TIMEOUT_MS: '30000',
      }),
    { message: 'VENTILATOR_SCRIPT_DIR is required' },
  );
});

test('uses default standby timeout when env var is missing', () => {
  const configuration = new VentilatorConfiguration({
    VENTILATOR_SCRIPT_DIR: '/tmp',
    VENTILATOR_BASH_START: './start.sh',
    VENTILATOR_BASH_STOP: './stop.sh',
    VENTILATOR_BASH_ROTATE: './rotate.sh',
    VENTILATOR_BASH_SPEED: './speed.sh',
  });

  assert.equal(configuration.ventilatorStandbyTimeoutMs, 60000);
});

test('throws when standby timeout env var is not an integer', () => {
  assert.throws(
    () =>
      new VentilatorConfiguration({
        VENTILATOR_SCRIPT_DIR: '/tmp',
        VENTILATOR_BASH_START: './start.sh',
        VENTILATOR_BASH_STOP: './stop.sh',
        VENTILATOR_BASH_ROTATE: './rotate.sh',
        VENTILATOR_BASH_SPEED: './speed.sh',
        VENTILATOR_STANDBY_TIMEOUT_MS: 'abc',
      }),
    { message: 'VENTILATOR_STANDBY_TIMEOUT_MS must be an integer' },
  );
});

test('throws when standby timeout env var is negative', () => {
  assert.throws(
    () =>
      new VentilatorConfiguration({
        VENTILATOR_SCRIPT_DIR: '/tmp',
        VENTILATOR_BASH_START: './start.sh',
        VENTILATOR_BASH_STOP: './stop.sh',
        VENTILATOR_BASH_ROTATE: './rotate.sh',
        VENTILATOR_BASH_SPEED: './speed.sh',
        VENTILATOR_STANDBY_TIMEOUT_MS: '-1',
      }),
    {
      message:
        'VENTILATOR_STANDBY_TIMEOUT_MS must be greater than or equal to 0',
    },
  );
});
