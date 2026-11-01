import { ShadeExecutionResultDto } from '../dtos/ShadeExecutionResultDto';
import { ShadeTerminalGatewayInterface } from '../infrastructures/ShadeTerminalGatewayInterface';
import { ShadeServiceInterface } from './ShadeServiceInterface';
import { ShadeBusyError } from './ShadeBusyError';
import { ShadeCommandError } from './ShadeCommandError';

export class ShadeService implements ShadeServiceInterface {
  private readonly gateway: ShadeTerminalGatewayInterface;
  private busy = false;
  constructor(gateway: ShadeTerminalGatewayInterface) {
    this.gateway = gateway;
  }
  public up(): Promise<void> {
    return this.execute(() => this.gateway.up());
  }
  public down(): Promise<void> {
    return this.execute(() => this.gateway.down());
  }
  public my(): Promise<void> {
    return this.execute(() => this.gateway.my());
  }
  private async execute(
    command: () => ReturnType<ShadeTerminalGatewayInterface['up']>,
  ): Promise<void> {
    if (this.busy) throw new ShadeBusyError();
    this.busy = true;
    let result: ShadeExecutionResultDto;
    try {
      result = await command();
    } catch {
      this.busy = true;
      throw new ShadeCommandError();
    }
    this.busy = !result.safeToContinue;
    if (!result.successful) throw new ShadeCommandError();
  }
}
