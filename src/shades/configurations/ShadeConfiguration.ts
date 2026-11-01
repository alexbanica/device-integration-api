import Dict = NodeJS.Dict;
import { ShadeConfigurationError } from './ShadeConfigurationError';

export class ShadeConfiguration {
  public readonly enabled: boolean;
  public readonly scriptDirectory: string;
  public readonly upCommand: string;
  public readonly downCommand: string;
  public readonly myCommand: string;

  constructor(env: Dict<string>) {
    const enabled = env.SHADE_ENABLED;
    if (enabled !== undefined && enabled !== 'true' && enabled !== 'false') {
      throw new ShadeConfigurationError('SHADE_ENABLED must be true or false');
    }
    this.enabled = enabled === 'true';
    this.scriptDirectory = env.SHADE_SCRIPT_DIR || '';
    this.upCommand = env.SHADE_BASH_UP || '';
    this.downCommand = env.SHADE_BASH_DOWN || '';
    this.myCommand = env.SHADE_BASH_MY || '';
    if (this.enabled) {
      for (const [name, value] of [
        ['SHADE_SCRIPT_DIR', this.scriptDirectory],
        ['SHADE_BASH_UP', this.upCommand],
        ['SHADE_BASH_DOWN', this.downCommand],
        ['SHADE_BASH_MY', this.myCommand],
      ]) {
        if (!value.trim())
          throw new ShadeConfigurationError(`${name} is required`);
      }
    }
  }
}
