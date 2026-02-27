import { HardwareCommandExecutorInterface } from './HardwareCommandExecutorInterface';
import { InfraredEmitterInterface } from '../../hardwares/infrastructures/InfraredEmitterInterface';

export class InfraredHardwareCommandExecutor
  implements HardwareCommandExecutorInterface
{
  private readonly infraredEmitter: InfraredEmitterInterface;

  constructor(infraredEmitter: InfraredEmitterInterface) {
    this.infraredEmitter = infraredEmitter;
  }

  public async execute(commandFilePath: string): Promise<number> {
    this.log('infrared_command_start', { commandFilePath });
    try {
      await this.infraredEmitter.emitFromFile(commandFilePath);
      this.log('infrared_command_complete', { commandFilePath });
      return 0;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'unknown_error';
      this.log('infrared_command_failed', {
        commandFilePath,
        error: errorMessage,
      });
      return 1;
    }
  }

  private log(event: string, details: Record<string, unknown>): void {
    console.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event,
        details,
      }),
    );
  }
}
