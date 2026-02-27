import Dict = NodeJS.Dict;
import { VentilatorConfigurationError } from './VentilatorConfigurationError';

export class VentilatorConfiguration {
  private readonly _ventilatorInfraredCommandsDirectory: string;
  private readonly _ventilatorStartInfraredCommandFile: string;
  private readonly _ventilatorStopInfraredCommandFile: string;
  private readonly _ventilatorRotateInfraredCommandFile: string;
  private readonly _ventilatorSpeedInfraredCommandFile: string;

  constructor(env: Dict<string>) {
    this._ventilatorInfraredCommandsDirectory =
      env.VENTILATOR_IR_COMMANDS_DIR || '';
    this._ventilatorStartInfraredCommandFile =
      env.VENTILATOR_IR_START_FILE || '';
    this._ventilatorStopInfraredCommandFile = env.VENTILATOR_IR_STOP_FILE || '';
    this._ventilatorRotateInfraredCommandFile =
      env.VENTILATOR_IR_ROTATE_FILE || '';
    this._ventilatorSpeedInfraredCommandFile =
      env.VENTILATOR_IR_SPEED_FILE || '';
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this._ventilatorInfraredCommandsDirectory) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_IR_COMMANDS_DIR is required',
      );
    }
    if (!this._ventilatorStartInfraredCommandFile) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_IR_START_FILE is required',
      );
    }
    if (!this._ventilatorStopInfraredCommandFile) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_IR_STOP_FILE is required',
      );
    }
    if (!this._ventilatorRotateInfraredCommandFile) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_IR_ROTATE_FILE is required',
      );
    }
    if (!this._ventilatorSpeedInfraredCommandFile) {
      throw new VentilatorConfigurationError(
        'VENTILATOR_IR_SPEED_FILE is required',
      );
    }
  }

  get ventilatorInfraredCommandsDirectory(): string {
    return this._ventilatorInfraredCommandsDirectory;
  }

  get ventilatorStartInfraredCommandFile(): string {
    return this._ventilatorStartInfraredCommandFile;
  }

  get ventilatorStopInfraredCommandFile(): string {
    return this._ventilatorStopInfraredCommandFile;
  }

  get ventilatorRotateInfraredCommandFile(): string {
    return this._ventilatorRotateInfraredCommandFile;
  }

  get ventilatorSpeedInfraredCommandFile(): string {
    return this._ventilatorSpeedInfraredCommandFile;
  }
}
