import { FanConfiguration } from '../configurations/FanConfiguration';
import { TerminalExecutorInterface } from '../../common/infrastructures/TerminalExecutorInterface';
import { FanTerminalGatewayInterface } from './FanTerminalGatewayInterface';

export class FanTerminalGateway implements FanTerminalGatewayInterface {
  private readonly terminal: TerminalExecutorInterface;
  private readonly configuration: FanConfiguration;
  private readonly currentTimeProvider: () => number;
  private lastSuccessfulCommandTimestampMs?: number;

  constructor(
    terminal: TerminalExecutorInterface,
    configuration: FanConfiguration,
    currentTimeProvider: () => number = () => Date.now(),
  ) {
    this.terminal = terminal;
    this.configuration = configuration;
    this.currentTimeProvider = currentTimeProvider;
  }

  public async start(isWakeupEligible: boolean): Promise<boolean> {
    return this.executeIntendedCommand(
      this.configuration.fanStartCommand,
      isWakeupEligible,
    );
  }

  public async stop(isWakeupEligible: boolean): Promise<boolean> {
    return this.executeIntendedCommand(
      this.configuration.fanStopCommand,
      isWakeupEligible,
    );
  }

  public async rotate(isWakeupEligible: boolean): Promise<boolean> {
    return this.executeIntendedCommand(
      this.configuration.fanRotateCommand,
      isWakeupEligible,
    );
  }

  public async increaseSpeed(
    steps: number,
    isWakeupEligible: boolean,
  ): Promise<number> {
    let successfulSteps = 0;
    for (let step = 0; step < steps; step++) {
      const isExecuted = await this.executeIntendedCommand(
        this.configuration.fanSpeedCommand,
        isWakeupEligible,
      );
      if (!isExecuted) {
        return successfulSteps;
      }
      successfulSteps++;
    }
    return successfulSteps;
  }

  private async executeIntendedCommand(
    command: string,
    isWakeupEligible: boolean,
  ): Promise<boolean> {
    if (isWakeupEligible && this.shouldExecuteWakeup()) {
      const isWakeupExecuted = await this.execute(
        this.configuration.fanStartCommand,
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
    return elapsedMs >= this.configuration.fanStandbyTimeoutMs;
  }

  private async execute(command: string): Promise<boolean> {
    const result = await this.terminal.execute(
      command,
      this.configuration.fanWorkingDirectory,
    );
    return result === 0;
  }
}
