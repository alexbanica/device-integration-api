import test from 'node:test';
import assert from 'node:assert/strict';
import { VentilatorTerminalGateway } from '../../../src/ventilator/infrastructures/VentilatorTerminalGateway';
import { HardwareCommandExecutorInterface } from '../../../src/common/infrastructures/HardwareCommandExecutorInterface';
import { VentilatorConfiguration } from '../../../src/ventilator/configurations/VentilatorConfiguration';

class HardwareCommandExecutorStub implements HardwareCommandExecutorInterface {
  public commandFilePaths: string[] = [];
  public returnCode = 0;

  public async execute(commandFilePath: string): Promise<number> {
    this.commandFilePaths.push(commandFilePath);
    return this.returnCode;
  }
}

function createConfiguration(): VentilatorConfiguration {
  return new VentilatorConfiguration({
    VENTILATOR_IR_COMMANDS_DIR: '/tmp/ir',
    VENTILATOR_IR_START_FILE: 'start.json',
    VENTILATOR_IR_STOP_FILE: 'stop.json',
    VENTILATOR_IR_ROTATE_FILE: 'rotate.json',
    VENTILATOR_IR_SPEED_FILE: 'speed.json',
  });
}

test('executes start/stop/rotate using infrared command files', async () => {
  const executor = new HardwareCommandExecutorStub();
  const gateway = new VentilatorTerminalGateway(executor, createConfiguration());

  const start = await gateway.start();
  const stop = await gateway.stop();
  const rotate = await gateway.rotate();

  assert.equal(start, true);
  assert.equal(stop, true);
  assert.equal(rotate, true);
  assert.deepEqual(executor.commandFilePaths, [
    '/tmp/ir/start.json',
    '/tmp/ir/stop.json',
    '/tmp/ir/rotate.json',
  ]);
});

test('increaseSpeed stops counting when execution fails', async () => {
  const executor = new HardwareCommandExecutorStub();
  const gateway = new VentilatorTerminalGateway(executor, createConfiguration());
  let calls = 0;
  executor.execute = async (commandFilePath: string): Promise<number> => {
    executor.commandFilePaths.push(commandFilePath);
    calls++;
    return calls === 2 ? 1 : 0;
  };

  const executedSteps = await gateway.increaseSpeed(3);

  assert.equal(executedSteps, 1);
  assert.deepEqual(executor.commandFilePaths, [
    '/tmp/ir/speed.json',
    '/tmp/ir/speed.json',
  ]);
});
