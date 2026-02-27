import test from 'node:test';
import assert from 'node:assert/strict';
import { VentilatorConfiguration } from '../../../src/ventilator/configurations/VentilatorConfiguration';

test('creates ventilator configuration when all env vars are present', () => {
  const configuration = new VentilatorConfiguration({
    VENTILATOR_IR_COMMANDS_DIR: '/tmp',
    VENTILATOR_IR_START_FILE: 'start.json',
    VENTILATOR_IR_STOP_FILE: 'stop.json',
    VENTILATOR_IR_ROTATE_FILE: 'rotate.json',
    VENTILATOR_IR_SPEED_FILE: 'speed.json',
  });

  assert.equal(configuration.ventilatorInfraredCommandsDirectory, '/tmp');
  assert.equal(configuration.ventilatorStartInfraredCommandFile, 'start.json');
  assert.equal(configuration.ventilatorStopInfraredCommandFile, 'stop.json');
  assert.equal(configuration.ventilatorRotateInfraredCommandFile, 'rotate.json');
  assert.equal(configuration.ventilatorSpeedInfraredCommandFile, 'speed.json');
});

test('throws when mandatory env var is missing', () => {
  assert.throws(
    () =>
      new VentilatorConfiguration({
        VENTILATOR_IR_START_FILE: 'start.json',
        VENTILATOR_IR_STOP_FILE: 'stop.json',
        VENTILATOR_IR_ROTATE_FILE: 'rotate.json',
        VENTILATOR_IR_SPEED_FILE: 'speed.json',
      }),
    { message: 'VENTILATOR_IR_COMMANDS_DIR is required' },
  );
});
