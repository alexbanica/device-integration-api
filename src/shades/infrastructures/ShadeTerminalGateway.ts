import { ShadeConfiguration } from '../configurations/ShadeConfiguration';
import { ShadeExecutionResultDto } from '../dtos/ShadeExecutionResultDto';
import { ShadeTerminalExecutorInterface } from './ShadeTerminalExecutorInterface';
import { ShadeTerminalGatewayInterface } from './ShadeTerminalGatewayInterface';

export class ShadeTerminalGateway implements ShadeTerminalGatewayInterface {
  constructor(
    private readonly terminal: ShadeTerminalExecutorInterface,
    private readonly config: ShadeConfiguration,
  ) {}

  public up(): Promise<ShadeExecutionResultDto> {
    return this.execute(this.config.upCommand);
  }

  public down(): Promise<ShadeExecutionResultDto> {
    return this.execute(this.config.downCommand);
  }

  public my(): Promise<ShadeExecutionResultDto> {
    return this.execute(this.config.myCommand);
  }

  private async execute(command: string): Promise<ShadeExecutionResultDto> {
    try {
      const code = await this.terminal.execute(
        command,
        this.config.scriptDirectory,
      );
      return new ShadeExecutionResultDto(
        code === 0,
        !this.terminal.isQuarantined(),
      );
    } catch {
      // Unknown terminal failures make exclusivity uncertain for this process.
      return new ShadeExecutionResultDto(false, false);
    }
  }
}
