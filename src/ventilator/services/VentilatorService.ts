import { VentilatorTerminal } from '../infrastructure/VentilatorTerminal';
import { VentilatorStateDto } from '../dtos/VentilatorStateDto';

export class VentilatorService {
  private static readonly MAX_SPEED = 3;
  private readonly ventilatorTerminal: VentilatorTerminal;
  private readonly _ventilatorState: VentilatorStateDto;

  constructor(ventilatorTerminal: VentilatorTerminal) {
    this.ventilatorTerminal = ventilatorTerminal;
    this._ventilatorState = new VentilatorStateDto();
  }

  public async toggle(): Promise<void> {
    console.log('Ventilator toggled. Before state:', this._ventilatorState);
    if (this._ventilatorState.isOn) {
      await this.stop();
      return;
    }

    await this.start();
  }

  public async start(): Promise<void> {
    if (await this.ventilatorTerminal.start()) {
      this._ventilatorState.isOn = true;
      this._ventilatorState.speed = 1;
      this._ventilatorState.isRotating = false;
      console.log('Ventilator started. State:', this._ventilatorState);
      return;
    }
    throw new Error('Ventilator failed to start');
  }

  public async stop(): Promise<void> {
    if (await this.ventilatorTerminal.stop()) {
      this._ventilatorState.isOn = false;
      this._ventilatorState.speed = 1;
      this._ventilatorState.isRotating = false;
      console.log('Ventilator stopped. State:', this._ventilatorState);
      return;
    }
    throw new Error('Ventilator failed to stop');
  }

  public async setSpeed(desiredSpeed: number): Promise<void> {
    const actualSpeed = this._ventilatorState.speed;
    if (actualSpeed === desiredSpeed || !this.ventilatorState.isOn) {
      return;
    }

    const increase =
      desiredSpeed > actualSpeed
        ? desiredSpeed - actualSpeed
        : VentilatorService.MAX_SPEED - actualSpeed + desiredSpeed;

    const actualIncrease = await this.ventilatorTerminal.setSpeed(increase);
    const newSpeed = actualSpeed + actualIncrease;
    this._ventilatorState.speed =
      newSpeed <= VentilatorService.MAX_SPEED
        ? newSpeed
        : newSpeed % VentilatorService.MAX_SPEED;
    console.log(
      `Ventilator speed set to ${desiredSpeed}. Actual speed: ${actualSpeed}. Actual increase: ${actualIncrease}. State:`,
      this._ventilatorState,
    );
  }

  public async rotate(): Promise<void> {
    const isCommandExecuted = await this.ventilatorTerminal.rotate();
    if (!isCommandExecuted) {
      throw new Error('Ventilator failed to rotate');
    }

    if (this._ventilatorState.isOn && isCommandExecuted) {
      this._ventilatorState.isRotating = true;
      console.log('Ventilator rotating. State:', this._ventilatorState);
      return;
    }
    this._ventilatorState.isRotating = false;
  }

  get ventilatorState(): VentilatorStateDto {
    return this._ventilatorState;
  }
}
