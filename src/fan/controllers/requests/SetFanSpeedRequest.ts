export class SetFanSpeedRequest {
  public readonly speed: number;

  private constructor(speed: number) {
    this.speed = speed;
  }

  public static fromRouteParameter(speedParameter: string): SetFanSpeedRequest {
    const speed = Number.parseInt(speedParameter, 10);
    if (!Number.isInteger(speed) || speed < 0 || speed > 3) {
      throw new Error('Speed must be a number between 0 and 3.');
    }
    return new SetFanSpeedRequest(speed);
  }
}
