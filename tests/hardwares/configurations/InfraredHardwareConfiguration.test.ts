import test from 'node:test';
import assert from 'node:assert/strict';
import { InfraredHardwareConfiguration } from '../../../src/hardwares/configurations/InfraredHardwareConfiguration';

test('creates infrared hardware configuration from env values', () => {
  const configuration = new InfraredHardwareConfiguration({
    PIGPIO_HOST: '127.0.0.1',
    PIGPIO_PORT: '9999',
    INFRARED_OUT_GPIO: '12',
    INFRARED_CARRIER_HZ: '38000',
    INFRARED_DUTY_CYCLE: '0.33',
    INFRARED_REPEAT: '2',
  });

  assert.equal(configuration.pigpioHost, '127.0.0.1');
  assert.equal(configuration.pigpioPort, 9999);
  assert.equal(configuration.infraredOutputGpio, 12);
  assert.equal(configuration.infraredCarrierHertz, 38000);
  assert.equal(configuration.infraredDutyCycle, 0.33);
  assert.equal(configuration.infraredRepeatCount, 2);
});

test('throws when pigpio port is invalid', () => {
  assert.throws(
    () =>
      new InfraredHardwareConfiguration({
        PIGPIO_PORT: 'abc',
      }),
    { message: 'PIGPIO_PORT must be a positive integer' },
  );
});

test('throws when duty cycle is out of range', () => {
  assert.throws(
    () =>
      new InfraredHardwareConfiguration({
        INFRARED_DUTY_CYCLE: '1.2',
      }),
    { message: 'INFRARED_DUTY_CYCLE must be greater than 0 and lower than 1' },
  );
});
