import test from 'node:test';
import assert from 'node:assert/strict';
import { VentilatorService } from '../VentilatorService';
import { VentilatorTerminalGatewayInterface } from '../../infrastructures/VentilatorTerminalGatewayInterface';

class VentilatorTerminalGatewayStub implements VentilatorTerminalGatewayInterface {
  public startCalls = 0;
  public stopCalls = 0;
  public rotateCalls = 0;
  public increaseSpeedCalls: number[] = [];

  public startResult = true;
  public stopResult = true;
  public rotateResult = true;
  public increaseSpeedResult?: number;

  public async start(): Promise<boolean> {
    this.startCalls++;
    return this.startResult;
  }

  public async stop(): Promise<boolean> {
    this.stopCalls++;
    return this.stopResult;
  }

  public async rotate(): Promise<boolean> {
    this.rotateCalls++;
    return this.rotateResult;
  }

  public async increaseSpeed(steps: number): Promise<number> {
    this.increaseSpeedCalls.push(steps);
    return this.increaseSpeedResult ?? steps;
  }
}

test('start is idempotent when already on', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.start();
  await service.start();

  const state = service.getState();
  assert.equal(gateway.startCalls, 1);
  assert.equal(state.isOn, true);
  assert.equal(state.speed, 1);
  assert.equal(state.isRotating, false);
});

test('setSpeed auto-starts when ventilator is off', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.setSpeed(3);

  const state = service.getState();
  assert.equal(gateway.startCalls, 1);
  assert.deepEqual(gateway.increaseSpeedCalls, [2]);
  assert.equal(state.isOn, true);
  assert.equal(state.speed, 3);
});

test('setSpeed uses circular increase steps', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.start();
  await service.setSpeed(3);
  await service.setSpeed(1);

  assert.deepEqual(gateway.increaseSpeedCalls, [2, 1]);
  assert.equal(service.getState().speed, 1);
});

test('rotate keeps rotating false when device is off', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.rotate();

  assert.equal(service.getState().isRotating, false);
});

test('rotate sets rotating true when device is on', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.start();
  await service.rotate();

  assert.equal(service.getState().isRotating, true);
});

test('stop is idempotent when already off', async () => {
  const gateway = new VentilatorTerminalGatewayStub();
  const service = new VentilatorService(gateway);

  await service.stop();

  assert.equal(gateway.stopCalls, 0);
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
