import { FanStateDto } from '../../dtos/FanStateDto';

export class FanStateResponse {
  public readonly isOn: boolean;
  public readonly speed: number;
  public readonly isRotating: boolean;

  constructor(state: FanStateDto) {
    this.isOn = state.isOn;
    this.speed = state.speed;
    this.isRotating = state.isRotating;
  }
}
