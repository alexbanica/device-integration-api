export interface VentilatorTerminalGatewayInterface {
  start(isWakeupEligible: boolean): Promise<boolean>;
  stop(isWakeupEligible: boolean): Promise<boolean>;
  rotate(isWakeupEligible: boolean): Promise<boolean>;
  increaseSpeed(steps: number, isWakeupEligible: boolean): Promise<number>;
}
