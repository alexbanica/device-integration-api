import { FanStateDto } from '../dtos/FanStateDto';
import { FanTerminalGatewayInterface } from '../infrastructures/FanTerminalGatewayInterface';
import { FanServiceInterface } from './FanServiceInterface';

export class FanService implements FanServiceInterface {
  private static readonly MAX_SPEED = 3;
  private readonly terminalGateway: FanTerminalGatewayInterface;
  private readonly state: FanStateDto;

  constructor(terminalGateway: FanTerminalGatewayInterface) {
    this.terminalGateway = terminalGateway;
    this.state = new FanStateDto();
  }

  public async start(): Promise<void> {
    if (this.state.isOn) {
      return;
    }

    const isExecuted = await this.terminalGateway.start(false);
    if (!isExecuted) {
      throw new Error('Fan failed to start');
    }

    this.state.isOn = true;
    this.state.speed = 1;
    this.state.isRotating = false;
  }

  public async stop(): Promise<void> {
    if (!this.state.isOn) {
      return;
    }

    const isExecuted = await this.terminalGateway.stop(true);
    if (!isExecuted) {
      throw new Error('Fan failed to stop');
    }

    this.state.isOn = false;
    this.state.speed = 0;
    this.state.isRotating = false;
  }

  public async rotate(): Promise<void> {
    const isExecuted = await this.terminalGateway.rotate(this.state.isOn);
    if (!isExecuted) {
      throw new Error('Fan failed to rotate');
    }

    this.state.isRotating = this.state.isOn;
  }

  public async setSpeed(desiredSpeed: number): Promise<void> {
    if (desiredSpeed < 0 || desiredSpeed > FanService.MAX_SPEED) {
      throw new Error('Fan speed must be between 0 and 3');
    }

    if (desiredSpeed === 0) {
      await this.stop();
      return;
    }

    if (!this.state.isOn) {
      await this.start();
    }

    const currentSpeed = this.state.speed;
    if (currentSpeed === desiredSpeed) {
      return;
    }

    const requiredSteps =
      desiredSpeed > currentSpeed
        ? desiredSpeed - currentSpeed
        : FanService.MAX_SPEED - currentSpeed + desiredSpeed;

    const actualSteps = await this.terminalGateway.increaseSpeed(
      requiredSteps,
      this.state.isOn,
    );
    if (actualSteps !== requiredSteps) {
      throw new Error('Fan failed to reach requested speed');
    }

    this.state.speed = desiredSpeed;
  }

  public getState(): FanStateDto {
    return this.state;
  }
}
