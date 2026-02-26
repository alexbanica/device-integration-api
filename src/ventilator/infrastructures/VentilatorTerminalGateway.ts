import { VentilatorConfiguration } from '../configurations/VentilatorConfiguration';
import { TerminalExecutorInterface } from '../../common/infrastructures/TerminalExecutorInterface';
import { VentilatorTerminalGatewayInterface } from './VentilatorTerminalGatewayInterface';

export class VentilatorTerminalGateway
  implements VentilatorTerminalGatewayInterface
{
  private readonly terminal: TerminalExecutorInterface;
  private readonly configuration: VentilatorConfiguration;

  constructor(
    terminal: TerminalExecutorInterface,
    configuration: VentilatorConfiguration,
  ) {
    this.terminal = terminal;
    this.configuration = configuration;
  }

  public async start(): Promise<boolean> {
    return this.execute(this.configuration.ventilatorStartCommand);
  }

  public async stop(): Promise<boolean> {
    return this.execute(this.configuration.ventilatorStopCommand);
  }

  public async rotate(): Promise<boolean> {
    return this.execute(this.configuration.ventilatorRotateCommand);
  }

  public async increaseSpeed(steps: number): Promise<number> {
    let successfulSteps = 0;
    for (let step = 0; step < steps; step++) {
      const isExecuted = await this.execute(this.configuration.ventilatorSpeedCommand);
      if (!isExecuted) {
        return successfulSteps;
      }
      successfulSteps++;
    }
    return successfulSteps;
  }

  private async execute(command: string): Promise<boolean> {
    const result = await this.terminal.execute(
      command,
      this.configuration.ventilatorWorkingDirectory,
    );
    return result === 0;
  }
}
