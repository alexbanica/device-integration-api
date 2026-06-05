import test from 'node:test';
import assert from 'node:assert/strict';
import { VentilatorService } from '../../../src/ventilator/services/VentilatorService';
import { VentilatorTerminalGatewayInterface } from '../../../src/ventilator/infrastructures/VentilatorTerminalGatewayInterface';

class VentilatorTerminalGatewayStub implements VentilatorTerminalGatewayInterface {
  public startCalls: boolean[] = [];
  public stopCalls: boolean[] = [];
  public rotateCalls: boolean[] = [];
  public increaseSpeedCalls: Array<{
    steps: number;
    isWakeupEligible: boolean;
  }> = [];

  public startResult = true;
  public stopResult = true;
  public rotateResult = true;
  public increaseSpeedResult?: number;

  public async start(isWakeupEligible: boolean): Promise<boolean> {
    this.startCalls.push(isWakeupEligible);
    return this.startResult;
  }

  public async stop(isWakeupEligible: boolean): Promise<boolean> {
    this.stopCalls.push(isWakeupEligible);
    return this.stopResult;
  }

  public async rotate(isWakeupEligible: boolean): Promise<boolean> {
    this.rotateCalls.push(isWakeupEligible);
    return this.rotateResult;
  }

  public async increaseSpeed(
    steps: number,
    isWakeupEligible: boolean,
  ): Promise<number> {
    this.increaseSpeedCalls.push({ steps, isWakeupEligible });
    return this.increaseSpeedResult ?? steps;
  }
}

test('start is idempotent when already on', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.start();
  await service.start();

  const state = service.getState();
  assert.deepEqual(gateway.startCalls, [false]);
  assert.equal(state.isOn, true);
  assert.equal(state.speed, 1);
  assert.equal(state.isRotating, false);
});

test('setSpeed auto-starts when ventilator is off', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.setSpeed(3);

  const state = service.getState();
  assert.deepEqual(gateway.startCalls, [false]);
  assert.deepEqual(gateway.increaseSpeedCalls, [
    { steps: 2, isWakeupEligible: true },
  ]);
  assert.equal(state.isOn, true);
  assert.equal(state.speed, 3);
});

test('setSpeed uses circular increase steps', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.start();
  await service.setSpeed(3);
  await service.setSpeed(1);

  assert.deepEqual(gateway.increaseSpeedCalls, [
    { steps: 2, isWakeupEligible: true },
    { steps: 1, isWakeupEligible: true },
  ]);
  assert.equal(service.getState().speed, 1);
});

test('rotate keeps rotating false when device is off', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.rotate();

  assert.deepEqual(gateway.rotateCalls, [false]);
  assert.equal(service.getState().isRotating, false);
});

test('rotate sets rotating true when device is on', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.start();
  await service.rotate();

  assert.deepEqual(gateway.rotateCalls, [true]);
  assert.equal(service.getState().isRotating, true);
});

test('stop is idempotent when already off', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.stop();

  assert.deepEqual(gateway.stopCalls, []);
  assert.equal(service.getState().isOn, false);
});

test('stop while on marks stop command wakeup eligible', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.start();
  await service.stop();

  assert.deepEqual(gateway.stopCalls, [true]);
  assert.equal(service.getState().isOn, false);
});

test('throws when speed change cannot execute all required steps', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  gateway.increaseSpeedResult = 1;
  const service = new VentilatorService(gateway);

  await service.start();

  await assert.rejects(() => service.setSpeed(3), {
    message: 'Ventilator failed to reach requested speed',
  });
});

test('throws when start command fails', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  gateway.startResult = false;
  const service = new VentilatorService(gateway);

  await assert.rejects(() => service.start(), {
    message: 'Ventilator failed to start',
  });
});
