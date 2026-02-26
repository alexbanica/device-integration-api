import { VentilatorStateDto } from '../../dtos/VentilatorStateDto';

export class VentilatorStateResponse {
  public readonly isOn: boolean;
  public readonly speed: number;
  public readonly isRotating: boolean;

  constructor(state: VentilatorStateDto) {
    this.isOn = state.isOn;
    this.speed = state.speed;
    this.isRotating = state.isRotating;
  }
}
