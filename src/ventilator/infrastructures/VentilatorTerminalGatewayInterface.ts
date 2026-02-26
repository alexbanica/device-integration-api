export interface VentilatorTerminalGatewayInterface {
  start(): Promise<boolean>;
  stop(): Promise<boolean>;
  rotate(): Promise<boolean>;
  increaseSpeed(steps: number): Promise<number>;
}
