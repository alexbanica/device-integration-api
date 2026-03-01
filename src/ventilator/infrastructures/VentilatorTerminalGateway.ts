import { VentilatorConfiguration } from '../configurations/VentilatorConfiguration';
import { TerminalExecutorInterface } from '../../common/infrastructures/TerminalExecutorInterface';
import { VentilatorTerminalGatewayInterface } from './VentilatorTerminalGatewayInterface';

export class VentilatorTerminalGateway implements VentilatorTerminalGatewayInterface {
  private readonly terminal: TerminalExecutorInterface;
  private readonly configuration: VentilatorConfiguration;
  private readonly currentTimeProvider: () => number;
  private lastSuccessfulCommandTimestampMs?: number;

  constructor(
    terminal: TerminalExecutorInterface,
    configuration: VentilatorConfiguration,
    currentTimeProvider: () => number = () => Date.now(),
  ) {
    this.terminal = terminal;
    this.configuration = configuration;
    this.currentTimeProvider = currentTimeProvider;
  }

  public async start(): Promise<boolean> {
    return this.executeIntendedCommand(this.configuration.ventilatorStartCommand);
  }

  public async stop(): Promise<boolean> {
    return this.executeIntendedCommand(this.configuration.ventilatorStopCommand);
  }

  public async rotate(): Promise<boolean> {
    return this.executeIntendedCommand(this.configuration.ventilatorRotateCommand);
  }

  public async increaseSpeed(steps: number): Promise<number> {
    let successfulSteps = 0;
    for (let step = 0; step < steps; step++) {
      const isExecuted = await this.executeIntendedCommand(
        this.configuration.ventilatorSpeedCommand,
      );
      if (!isExecuted) {
        return successfulSteps;
      }
      successfulSteps++;
    }
    return successfulSteps;
  }

  private async executeIntendedCommand(command: string): Promise<boolean> {
    if (this.shouldExecuteWakeup()) {
      const isWakeupExecuted = await this.execute(
        this.configuration.ventilatorStartCommand,
      );
      if (!isWakeupExecuted) {
        return false;
      }
    }

    const isExecuted = await this.execute(command);
    if (isExecuted) {
      this.lastSuccessfulCommandTimestampMs = this.currentTimeProvider();
    }

    return isExecuted;
  }

  private shouldExecuteWakeup(): boolean {
    if (this.lastSuccessfulCommandTimestampMs === undefined) {
      return false;
    }

    const elapsedMs =
      this.currentTimeProvider() - this.lastSuccessfulCommandTimestampMs;
    return elapsedMs >= this.configuration.ventilatorStandbyTimeoutMs;
  }

  private async execute(command: string): Promise<boolean> {
    const result = await this.terminal.execute(
      command,
      this.configuration.ventilatorWorkingDirectory,
    );
    return result === 0;
  }
}
