import Dict = NodeJS.Dict;
import { InfraredHardwareConfigurationError } from './InfraredHardwareConfigurationError';

export class InfraredHardwareConfiguration {
  private readonly _pigpioHost: string;
  private readonly _pigpioPort: number;
  private readonly _infraredOutputGpio: number;
  private readonly _infraredCarrierHertz: number;
  private readonly _infraredDutyCycle: number;
  private readonly _infraredRepeatCount: number;

  constructor(env: Dict<string>) {
    this._pigpioHost = env.PIGPIO_HOST || 'localhost';
    this._pigpioPort = Number.parseInt(env.PIGPIO_PORT || '8888', 10);
    this._infraredOutputGpio = Number.parseInt(
      env.INFRARED_OUT_GPIO || '12',
      10,
    );
    this._infraredCarrierHertz = Number.parseInt(
      env.INFRARED_CARRIER_HZ || '38000',
      10,
    );
    this._infraredDutyCycle = Number.parseFloat(
      env.INFRARED_DUTY_CYCLE || '0.5',
    );
    this._infraredRepeatCount = Number.parseInt(env.INFRARED_REPEAT || '1', 10);
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this._pigpioHost) {
      throw new InfraredHardwareConfigurationError('PIGPIO_HOST is required');
    }
    if (!Number.isInteger(this._pigpioPort) || this._pigpioPort <= 0) {
      throw new InfraredHardwareConfigurationError(
        'PIGPIO_PORT must be a positive integer',
      );
    }
    if (!Number.isInteger(this._infraredOutputGpio) || this._infraredOutputGpio < 0) {
      throw new InfraredHardwareConfigurationError(
        'INFRARED_OUT_GPIO must be zero or a positive integer',
      );
    }
    if (
      !Number.isInteger(this._infraredCarrierHertz) ||
      this._infraredCarrierHertz <= 0
    ) {
      throw new InfraredHardwareConfigurationError(
        'INFRARED_CARRIER_HZ must be a positive integer',
      );
    }
    if (this._infraredDutyCycle <= 0 || this._infraredDutyCycle >= 1) {
      throw new InfraredHardwareConfigurationError(
        'INFRARED_DUTY_CYCLE must be greater than 0 and lower than 1',
      );
    }
    if (
      !Number.isInteger(this._infraredRepeatCount) ||
      this._infraredRepeatCount <= 0
    ) {
      throw new InfraredHardwareConfigurationError(
        'INFRARED_REPEAT must be a positive integer',
      );
    }
  }

  get pigpioHost(): string {
    return this._pigpioHost;
  }

  get pigpioPort(): number {
    return this._pigpioPort;
  }

  get infraredOutputGpio(): number {
    return this._infraredOutputGpio;
  }

  get infraredCarrierHertz(): number {
    return this._infraredCarrierHertz;
  }

  get infraredDutyCycle(): number {
    return this._infraredDutyCycle;
  }

  get infraredRepeatCount(): number {
    return this._infraredRepeatCount;
  }
}
