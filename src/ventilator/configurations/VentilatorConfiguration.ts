import Dict = NodeJS.Dict;
import { VentilatorConfigurationError } from './VentilatorConfigurationError';

export class VentilatorConfiguration {
  private readonly _ventilatorWorkingDirectory: string;
  private readonly _ventilatorStartCommand: string;
  private readonly _ventilatorStopCommand: string;
  private readonly _ventilatorRotateCommand: string;
  private readonly _ventilatorSpeedCommand: string;
  private readonly _ventilatorStandbyTimeoutMs: number;

  constructor(env: Dict<string>) {
    this._ventilatorWorkingDirectory = env.VENTILATOR_SCRIPT_DIR || '';
    this._ventilatorStartCommand = env.VENTILATOR_BASH_START || '';
    this._ventilatorStopCommand = env.VENTILATOR_BASH_STOP || '';
    this._ventilatorRotateCommand = env.VENTILATOR_BASH_ROTATE || '';
    this._ventilatorSpeedCommand = env.VENTILATOR_BASH_SPEED || '';
    this._ventilatorStandbyTimeoutMs = Number.parseInt(
      env.VENTILATOR_STANDBY_TIMEOUT_MS || '',
      10,
    );
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this._ventilatorWorkingDirectory) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_SCRIPT_DIR is required',
      );
    }
    if (!this._ventilatorStartCommand) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_BASH_START is required',
      );
    }
    if (!this._ventilatorStopCommand) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_BASH_STOP is required',
      );
    }
    if (!this._ventilatorRotateCommand) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_BASH_ROTATE is required',
      );
    }
    if (!this._ventilatorSpeedCommand) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_BASH_SPEED is required',
      );
    }
    if (!Number.isInteger(this._ventilatorStandbyTimeoutMs)) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_STANDBY_TIMEOUT_MS must be an integer',
      );
    }
    if (this._ventilatorStandbyTimeoutMs < 0) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_STANDBY_TIMEOUT_MS must be greater than or equal to 0',
      );
    }
  }

  get ventilatorWorkingDirectory(): string {
    return this._ventilatorWorkingDirectory;
  }

  get ventilatorStartCommand(): string {
    return this._ventilatorStartCommand;
  }

  get ventilatorStopCommand(): string {
    return this._ventilatorStopCommand;
  }

  get ventilatorRotateCommand(): string {
    return this._ventilatorRotateCommand;
  }

  get ventilatorSpeedCommand(): string {
    return this._ventilatorSpeedCommand;
  }

  get ventilatorStandbyTimeoutMs(): number {
    return this._ventilatorStandbyTimeoutMs;
  }
}
