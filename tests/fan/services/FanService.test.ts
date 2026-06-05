import test from 'node:test';
import assert from 'node:assert/strict';
import { FanService } from '../../../src/fan/services/FanService';
import { FanTerminalGatewayInterface } from '../../../src/fan/infrastructures/FanTerminalGatewayInterface';
import { FanStateStoreInterface } from '../../../src/fan/services/FanStateStoreInterface';
import { FanStateDto } from '../../../src/fan/dtos/FanStateDto';

class FanTerminalGatewayStub implements FanTerminalGatewayInterface {
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

class FanStateStoreStub implements FanStateStoreInterface {
  public savedStates: FanStateDto[] = [];

  public async load(): Promise<FanStateDto> {
    throw new Error('load is not used by FanService tests');
  }

  public async save(state: FanStateDto): Promise<void> {
    const savedState = new FanStateDto();
    savedState.isOn = state.isOn;
    savedState.speed = state.speed;
    savedState.isRotating = state.isRotating;
    this.savedStates.push(savedState);
  }
}

function createOnState(speed = 1, isRotating = false): FanStateDto {
  const state = new FanStateDto();
  state.isOn = true;
  state.speed = speed;
  state.isRotating = isRotating;
  return state;
}

test('start is idempotent when already on', async () => {
  const gateway = new FanTerminalGatewayStub();
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore);

  await service.start();
  await service.start();

  const state = service.getState();
  assert.deepEqual(gateway.startCalls, [false]);
  assert.deepEqual(stateStore.savedStates, [createOnState()]);
  assert.equal(state.isOn, true);
  assert.equal(state.speed, 1);
  assert.equal(state.isRotating, false);
});

test('loads persisted state as initial state', () => {
  const gateway = new FanTerminalGatewayStub();
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore, createOnState(3, true));

  const state = service.getState();
  assert.equal(state.isOn, true);
  assert.equal(state.speed, 3);
  assert.equal(state.isRotating, true);
});

test('setSpeed auto-starts when fan is off', async () => {
  const gateway = new FanTerminalGatewayStub();
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore);

  await service.setSpeed(3);

  const state = service.getState();
  assert.deepEqual(gateway.startCalls, [false]);
  assert.deepEqual(gateway.increaseSpeedCalls, [
    { steps: 2, isWakeupEligible: true },
  ]);
  assert.deepEqual(stateStore.savedStates, [createOnState(), createOnState(3)]);
  assert.equal(state.isOn, true);
  assert.equal(state.speed, 3);
});

test('setSpeed uses circular increase steps', async () => {
  const gateway = new FanTerminalGatewayStub();
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore);

  await service.start();
  await service.setSpeed(3);
  await service.setSpeed(1);

  assert.deepEqual(gateway.increaseSpeedCalls, [
    { steps: 2, isWakeupEligible: true },
    { steps: 1, isWakeupEligible: true },
  ]);
  assert.deepEqual(stateStore.savedStates, [
    createOnState(),
    createOnState(3),
    createOnState(1),
  ]);
  assert.equal(service.getState().speed, 1);
});

test('setSpeed does not save when requested speed already matches state', async () => {
  const gateway = new FanTerminalGatewayStub();
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore, createOnState(2));

  await service.setSpeed(2);

  assert.deepEqual(gateway.increaseSpeedCalls, []);
  assert.deepEqual(stateStore.savedStates, []);
});

test('rotate keeps rotating false when device is off', async () => {
  const gateway = new FanTerminalGatewayStub();
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore);

  await service.rotate();

  assert.deepEqual(gateway.rotateCalls, [false]);
  assert.deepEqual(stateStore.savedStates, []);
  assert.equal(service.getState().isRotating, false);
});

test('rotate sets rotating true when device is on', async () => {
  const gateway = new FanTerminalGatewayStub();
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore);

  await service.start();
  await service.rotate();

  assert.deepEqual(gateway.rotateCalls, [true]);
  assert.deepEqual(stateStore.savedStates, [
    createOnState(),
    createOnState(1, true),
  ]);
  assert.equal(service.getState().isRotating, true);
});

test('rotate does not save when command fails', async () => {
  const gateway = new FanTerminalGatewayStub();
  gateway.rotateResult = false;
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore, createOnState());

  await assert.rejects(() => service.rotate(), {
    message: 'Fan failed to rotate',
  });
  assert.deepEqual(stateStore.savedStates, []);
});

test('stop is idempotent when already off', async () => {
  const gateway = new FanTerminalGatewayStub();
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore);

  await service.stop();

  assert.deepEqual(gateway.stopCalls, []);
  assert.deepEqual(stateStore.savedStates, []);
  assert.equal(service.getState().isOn, false);
});

test('stop while on marks stop command wakeup eligible', async () => {
  const gateway = new FanTerminalGatewayStub();
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore);

  await service.start();
  await service.stop();

  assert.deepEqual(gateway.stopCalls, [true]);
  assert.deepEqual(stateStore.savedStates, [createOnState(), new FanStateDto()]);
  assert.equal(service.getState().isOn, false);
});

test('throws when speed change cannot execute all required steps', async () => {
  const gateway = new FanTerminalGatewayStub();
  gateway.increaseSpeedResult = 1;
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore);

  await service.start();

  await assert.rejects(() => service.setSpeed(3), {
    message: 'Fan failed to reach requested speed',
  });
  assert.deepEqual(stateStore.savedStates, [createOnState()]);
});

test('throws when start command fails', async () => {
  const gateway = new FanTerminalGatewayStub();
  gateway.startResult = false;
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore);

  await assert.rejects(() => service.start(), {
    message: 'Fan failed to start',
  });
  assert.deepEqual(stateStore.savedStates, []);
});

test('does not save when speed validation fails', async () => {
  const gateway = new FanTerminalGatewayStub();
  const stateStore = new FanStateStoreStub();
  const service = new FanService(gateway, stateStore);

  await assert.rejects(() => service.setSpeed(4), {
    message: 'Fan speed must be between 0 and 3',
  });
  assert.deepEqual(stateStore.savedStates, []);
});
