import Dict = NodeJS.Dict;

class VentilatorConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VentilatorConfigurationError';
  }
}

class VentilatorConfiguration {
  private readonly _ventilatorWorkingDirectory: string;
  private readonly _ventilatorStartCommand: string;
  private readonly _ventilatorStopCommand: string;
  private readonly _ventilatorRotateCommand: string;
  private readonly _ventilatorSpeedCommand: string;

  constructor(env: Dict<string>) {
    this._ventilatorWorkingDirectory = env.VENTILATOR_WORKING_DIRECTORY || '';
    this._ventilatorStartCommand = env.VENTILATOR_START_COMMAND || '';
    this._ventilatorStopCommand = env.VENTILATOR_STOP_COMMAND || '';
    this._ventilatorRotateCommand = env.VENTILATOR_ROTATE_COMMAND || '';
    this._ventilatorSpeedCommand = env.VENTILATOR_SPEED_COMMAND || '';
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this._ventilatorWorkingDirectory) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_WORKING_DIRECTORY is required',
      );
    }
    if (!this._ventilatorStartCommand) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_START_COMMAND is required',
      );
    }
    if (!this._ventilatorStopCommand) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_STOP_COMMAND is required',
      );
    }
    if (!this._ventilatorRotateCommand) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_ROTATE_COMMAND is required',
      );
    }
    if (!this._ventilatorSpeedCommand) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_SPEED_COMMAND is required',
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
}

export { VentilatorConfiguration };
