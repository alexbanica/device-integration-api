import { VentilatorStateDto } from '../dtos/VentilatorStateDto';
import { VentilatorTerminalGatewayInterface } from '../infrastructures/VentilatorTerminalGatewayInterface';
import { VentilatorServiceInterface } from './VentilatorServiceInterface';

export class VentilatorService implements VentilatorServiceInterface {
  private static readonly MAX_SPEED = 3;
  private readonly terminalGateway: VentilatorTerminalGatewayInterface;
  private readonly state: VentilatorStateDto;

  constructor(terminalGateway: VentilatorTerminalGatewayInterface) {
    this.terminalGateway = terminalGateway;
    this.state = new VentilatorStateDto();
  }

  public async start(): Promise<void> {
    if (this.state.isOn) {
      return;
    }

    const isExecuted = await this.terminalGateway.start();
    if (!isExecuted) {
      throw new Error('Ventilator failed to start');
    }

    this.state.isOn = true;
    this.state.speed = 1;
    this.state.isRotating = false;
  }

  public async stop(): Promise<void> {
    if (!this.state.isOn) {
      return;
    }

    const isExecuted = await this.terminalGateway.stop();
    if (!isExecuted) {
      throw new Error('Ventilator failed to stop');
    }

    this.state.isOn = false;
    this.state.speed = 0;
    this.state.isRotating = false;
  }

  public async rotate(): Promise<void> {
    const isExecuted = await this.terminalGateway.rotate();
    if (!isExecuted) {
      throw new Error('Ventilator failed to rotate');
    }

    this.state.isRotating = this.state.isOn;
  }

  public async setSpeed(desiredSpeed: number): Promise<void> {
    if (desiredSpeed < 0 || desiredSpeed > VentilatorService.MAX_SPEED) {
      throw new Error('Ventilator speed must be between 0 and 3');
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
        : VentilatorService.MAX_SPEED - currentSpeed + desiredSpeed;

    const actualSteps = await this.terminalGateway.increaseSpeed(requiredSteps);
    if (actualSteps !== requiredSteps) {
      throw new Error('Ventilator failed to reach requested speed');
    }

    this.state.speed = desiredSpeed;
  }

  public getState(): VentilatorStateDto {
    return this.state;
  }
}
