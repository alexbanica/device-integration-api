import test from 'node:test';
import assert from 'node:assert/strict';
import { InfraredHardwareCommandExecutor } from '../../../src/common/infrastructures/InfraredHardwareCommandExecutor';
import { InfraredEmitterInterface } from '../../../src/hardwares/infrastructures/InfraredEmitterInterface';

class InfraredEmitterStub implements InfraredEmitterInterface {
  public executedFiles: string[] = [];
  public shouldThrow = false;

  public async emitFromFile(filePath: string): Promise<void> {
    this.executedFiles.push(filePath);
    if (this.shouldThrow) {
      throw new Error('infrared_error');
    }
  }
}

test('returns 0 when infrared emission succeeds', async () => {
  const emitter = new InfraredEmitterStub();
  const executor = new InfraredHardwareCommandExecutor(emitter);

  const code = await executor.execute('/tmp/start.json');

  assert.equal(code, 0);
  assert.deepEqual(emitter.executedFiles, ['/tmp/start.json']);
});

test('returns 1 when infrared emission fails', async () => {
  const emitter = new InfraredEmitterStub();
  emitter.shouldThrow = true;
  const executor = new InfraredHardwareCommandExecutor(emitter);

  const code = await executor.execute('/tmp/start.json');

  assert.equal(code, 1);
});
