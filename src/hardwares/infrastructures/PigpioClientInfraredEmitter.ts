import fs from 'node:fs';
import { InfraredHardwareConfiguration } from '../configurations/InfraredHardwareConfiguration';
import { InfraredEmitterInterface } from './InfraredEmitterInterface';
import { InfraredWavePulseDto } from '../dtos/InfraredWavePulseDto';

type JsonObject = Record<string, unknown>;
type PigpioClientType = Record<string, unknown>;

export class PigpioClientInfraredEmitter implements InfraredEmitterInterface {
  private readonly configuration: InfraredHardwareConfiguration;
  private client: PigpioClientType | null;

  constructor(configuration: InfraredHardwareConfiguration) {
    this.configuration = configuration;
    this.client = null;
  }

  public async emitFromFile(filePath: string): Promise<void> {
    const pulseDurations = this.loadPulseDurations(filePath);
    await this.emit(pulseDurations);
  }

  private async emit(pulseDurations: number[]): Promise<void> {
    const client = await this.getClient();
    const gpioMask = 1 << this.configuration.infraredOutputGpio;
    const wavePulses = this.toWavePulses(pulseDurations, gpioMask);

    await this.invokeFirstAvailable(client, ['waveClear', 'wave_clear']);
    await this.invokeFirstAvailable(
      client,
      ['waveAddGeneric', 'wave_add_generic', 'waveAddPulse', 'wave_add_pulse'],
      [wavePulses],
    );
    const waveId = await this.invokeFirstAvailable<number>(
      client,
      ['waveCreate', 'wave_create'],
    );
    if (!Number.isInteger(waveId) || waveId < 0) {
      throw new Error(`Failed to create pigpio wave: ${waveId}`);
    }

    try {
      for (let repetition = 0; repetition < this.configuration.infraredRepeatCount; repetition++) {
        await this.invokeFirstAvailable(client, [
          'waveSendOnce',
          'wave_send_once',
          'waveTxSend',
          'wave_tx_send',
        ], [waveId]);
        await this.waitWaveTransmission(client);
      }
    } finally {
      await this.invokeFirstAvailable(client, ['waveDelete', 'wave_delete'], [waveId]);
    }
  }

  private async waitWaveTransmission(client: PigpioClientType): Promise<void> {
    while (await this.invokeFirstAvailable<boolean>(client, ['waveTxBusy', 'wave_tx_busy'])) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }

  private toWavePulses(
    pulseDurations: number[],
    gpioMask: number,
  ): InfraredWavePulseDto[] {
    const wavePulses: InfraredWavePulseDto[] = [];
    pulseDurations.forEach((duration, index) => {
      if (index % 2 === 0) {
        wavePulses.push(...this.toCarrierWave(duration, gpioMask));
        return;
      }
      if (duration > 0) {
        wavePulses.push(new InfraredWavePulseDto(0, gpioMask, duration));
      }
    });
    return wavePulses;
  }

  private toCarrierWave(markMicroseconds: number, gpioMask: number): InfraredWavePulseDto[] {
    const periodMicroseconds = Math.floor(
      1_000_000 / this.configuration.infraredCarrierHertz,
    );
    const onMicroseconds = Math.floor(
      periodMicroseconds * this.configuration.infraredDutyCycle,
    );
    const offMicroseconds = periodMicroseconds - onMicroseconds;
    const cycles = Math.max(1, Math.floor(markMicroseconds / periodMicroseconds));
    const pulses: InfraredWavePulseDto[] = [];

    for (let index = 0; index < cycles; index++) {
      if (onMicroseconds > 0) {
        pulses.push(new InfraredWavePulseDto(gpioMask, 0, onMicroseconds));
      }
      if (offMicroseconds > 0) {
        pulses.push(new InfraredWavePulseDto(0, gpioMask, offMicroseconds));
      }
    }

    const remainder = markMicroseconds - cycles * periodMicroseconds;
    if (remainder > 0) {
      pulses.push(new InfraredWavePulseDto(gpioMask, 0, remainder));
    }

    return pulses;
  }

  private loadPulseDurations(filePath: string): number[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Infrared command file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonValue = JSON.parse(fileContent) as JsonObject;
    const pulseUs = jsonValue.pulse_us;
    if (!Array.isArray(pulseUs) || pulseUs.length === 0) {
      throw new Error(`Invalid infrared pulse payload in file: ${filePath}`);
    }

    const durations = pulseUs.map((value, index) => {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(
          `Invalid pulse duration at index ${index} in file: ${filePath}`,
        );
      }
      return parsed;
    });

    return durations;
  }

  private async getClient(): Promise<PigpioClientType> {
    if (this.client) {
      return this.client;
    }

    const moduleUnknown: unknown = require('pigpio-client');
    const factory = this.resolvePigpioFactory(moduleUnknown);
    const client = factory({
      host: this.configuration.pigpioHost,
      port: this.configuration.pigpioPort,
    });

    await this.ensureConnected(client);
    this.client = client;
    return client;
  }

  private resolvePigpioFactory(
    moduleUnknown: unknown,
  ): (options: { host: string; port: number }) => PigpioClientType {
    if (
      typeof moduleUnknown === 'object' &&
      moduleUnknown !== null &&
      'pigpio' in moduleUnknown &&
      typeof (moduleUnknown as { pigpio: unknown }).pigpio === 'function'
    ) {
      return (moduleUnknown as { pigpio: (options: { host: string; port: number }) => PigpioClientType }).pigpio;
    }

    if (typeof moduleUnknown === 'function') {
      return moduleUnknown as (options: {
        host: string;
        port: number;
      }) => PigpioClientType;
    }

    throw new Error('pigpio-client module is available but has unknown API');
  }

  private async ensureConnected(client: PigpioClientType): Promise<void> {
    if (typeof client.connect === 'function') {
      await (client.connect as () => Promise<void>)();
    }
    if (typeof client.connected === 'function') {
      const connected = await (client.connected as () => Promise<boolean>)();
      if (!connected) {
        throw new Error(
          `Cannot connect to pigpio endpoint ${this.configuration.pigpioHost}:${this.configuration.pigpioPort}`,
        );
      }
    }
  }

  private async invokeFirstAvailable<T = void>(
    target: PigpioClientType,
    functionNames: string[],
    args: unknown[] = [],
  ): Promise<T> {
    for (const functionName of functionNames) {
      const candidate = target[functionName];
      if (typeof candidate === 'function') {
        const result = (candidate as (...values: unknown[]) => unknown).apply(
          target,
          args,
        );
        return (await Promise.resolve(result)) as T;
      }
    }

    throw new Error(
      `Unsupported pigpio-client API. Missing one of: ${functionNames.join(', ')}`,
    );
  }
}
