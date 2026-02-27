export class InfraredWavePulseDto {
  public readonly gpioOn: number;
  public readonly gpioOff: number;
  public readonly usDelay: number;

  constructor(gpioOn: number, gpioOff: number, usDelay: number) {
    this.gpioOn = gpioOn;
    this.gpioOff = gpioOff;
    this.usDelay = usDelay;
  }
}
