import { VentilatorConfiguration } from '../configurations/VentilatorConfiguration';
import path from 'node:path';
import { HardwareCommandExecutorInterface } from '../../common/infrastructures/HardwareCommandExecutorInterface';
import { VentilatorTerminalGatewayInterface } from './VentilatorTerminalGatewayInterface';

export class VentilatorTerminalGateway implements VentilatorTerminalGatewayInterface {
  private readonly hardwareCommandExecutor: HardwareCommandExecutorInterface;
  private readonly configuration: VentilatorConfiguration;

  constructor(
    hardwareCommandExecutor: HardwareCommandExecutorInterface,
    configuration: VentilatorConfiguration,
  ) {
    this.hardwareCommandExecutor = hardwareCommandExecutor;
    this.configuration = configuration;
  }

  public async start(): Promise<boolean> {
    return this.execute(this.configuration.ventilatorStartInfraredCommandFile);
  }

  public async stop(): Promise<boolean> {
    return this.execute(this.configuration.ventilatorStopInfraredCommandFile);
  }

  public async rotate(): Promise<boolean> {
    return this.execute(this.configuration.ventilatorRotateInfraredCommandFile);
  }

  public async increaseSpeed(steps: number): Promise<number> {
    let successfulSteps = 0;
    for (let step = 0; step < steps; step++) {
      const isExecuted = await this.execute(
        this.configuration.ventilatorSpeedInfraredCommandFile,
      );
      if (!isExecuted) {
        return successfulSteps;
      }
      successfulSteps++;
    }
    return successfulSteps;
  }

  private async execute(commandFile: string): Promise<boolean> {
    const commandFilePath = path.resolve(
      this.configuration.ventilatorInfraredCommandsDirectory,
      commandFile,
    );
    const result = await this.hardwareCommandExecutor.execute(commandFilePath);
    return result === 0;
  }
}
