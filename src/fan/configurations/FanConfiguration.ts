import Dict = NodeJS.Dict;
import { FanConfigurationError } from './FanConfigurationError';

export class FanConfiguration {
  private static readonly DEFAULT_STANDBY_TIMEOUT_MS = 60000;
  private readonly _fanWorkingDirectory: string;
  private readonly _fanStartCommand: string;
  private readonly _fanStopCommand: string;
  private readonly _fanRotateCommand: string;
  private readonly _fanSpeedCommand: string;
  private readonly _fanStandbyTimeoutMs: number;

  constructor(env: Dict<string>) {
    this._fanWorkingDirectory = env.FAN_SCRIPT_DIR || '';
    this._fanStartCommand = env.FAN_BASH_START || '';
    this._fanStopCommand = env.FAN_BASH_STOP || '';
    this._fanRotateCommand = env.FAN_BASH_ROTATE || '';
    this._fanSpeedCommand = env.FAN_BASH_SPEED || '';
    this._fanStandbyTimeoutMs =
      env.FAN_STANDBY_TIMEOUT_MS === undefined
        ? FanConfiguration.DEFAULT_STANDBY_TIMEOUT_MS
        : Number.parseInt(env.FAN_STANDBY_TIMEOUT_MS, 10);
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this._fanWorkingDirectory) {
      throw new FanConfigurationError('FAN_SCRIPT_DIR is required');
    }
    if (!this._fanStartCommand) {
      throw new FanConfigurationError('FAN_BASH_START is required');
    }
    if (!this._fanStopCommand) {
      throw new FanConfigurationError('FAN_BASH_STOP is required');
    }
    if (!this._fanRotateCommand) {
      throw new FanConfigurationError('FAN_BASH_ROTATE is required');
    }
    if (!this._fanSpeedCommand) {
      throw new FanConfigurationError('FAN_BASH_SPEED is required');
    }
    if (!Number.isInteger(this._fanStandbyTimeoutMs)) {
      throw new FanConfigurationError(
        'FAN_STANDBY_TIMEOUT_MS must be an integer',
      );
    }
    if (this._fanStandbyTimeoutMs < 0) {
      throw new FanConfigurationError(
        'FAN_STANDBY_TIMEOUT_MS must be greater than or equal to 0',
      );
    }
  }

  get fanWorkingDirectory(): string {
    return this._fanWorkingDirectory;
  }

  get fanStartCommand(): string {
    return this._fanStartCommand;
  }

  get fanStopCommand(): string {
    return this._fanStopCommand;
  }

  get fanRotateCommand(): string {
    return this._fanRotateCommand;
  }

  get fanSpeedCommand(): string {
    return this._fanSpeedCommand;
  }

  get fanStandbyTimeoutMs(): number {
    return this._fanStandbyTimeoutMs;
  }
}
