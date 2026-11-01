import { ShadeExecutionResultDto } from '../dtos/ShadeExecutionResultDto';

export interface ShadeTerminalGatewayInterface {
  up(): Promise<ShadeExecutionResultDto>;
  down(): Promise<ShadeExecutionResultDto>;
  my(): Promise<ShadeExecutionResultDto>;
}
