import fs from 'node:fs';
import { InfraredHardwareConfiguration } from '../configurations/InfraredHardwareConfiguration';
import { InfraredEmitterInterface } from './InfraredEmitterInterface';
import { InfraredWavePulseDto } from '../dtos/InfraredWavePulseDto';

type JsonObject = Record<string, unknown>;
type PigpioWavePulse = [number, number, number];

interface PigpioGpioInterface {
  modeSet(mode: 'input' | 'in' | 'output' | 'out'): Promise<void>;
  write(level: number): Promise<void>;
  waveClear(): Promise<void>;
  waveAddPulse(pulses: PigpioWavePulse[]): Promise<void>;
  waveCreate(): Promise<number>;
  waveSendOnce(waveId: number): Promise<number>;
  waveBusy(): Promise<number>;
  waveDelete(waveId: number): Promise<void>;
}

interface PigpioConnectionInterface {
  once(event: 'connected' | 'error', listener: (...args: unknown[]) => void): void;
  gpio(gpioPin: number): PigpioGpioInterface;
}

interface PigpioModuleInterface {
  pigpio(options: { host: string; port: number }): PigpioConnectionInterface;
}

export class PigpioClientInfraredEmitter implements InfraredEmitterInterface {
  private readonly configuration: InfraredHardwareConfiguration;
  private client: PigpioConnectionInterface | null;
  private gpio: PigpioGpioInterface | null;

  constructor(configuration: InfraredHardwareConfiguration) {
    this.configuration = configuration;
    this.client = null;
    this.gpio = null;
  }

  public async emitFromFile(filePath: string): Promise<void> {
    const pulseDurations = this.loadPulseDurations(filePath);
    await this.emit(pulseDurations);
  }

  private async emit(pulseDurations: number[]): Promise<void> {
    const gpio = await this.getGpio();
    const gpioMask = 1 << this.configuration.infraredOutputGpio;
    const wavePulses = this.toWavePulses(pulseDurations, gpioMask).map(
      (pulse): PigpioWavePulse => [pulse.gpioOn, pulse.gpioOff, pulse.usDelay],
    );

    await gpio.modeSet('output');
    await gpio.write(0);

    await gpio.waveClear();
    await gpio.waveAddPulse(wavePulses);
    const waveId = await gpio.waveCreate();
    if (!Number.isInteger(waveId) || waveId < 0) {
      throw new Error(`Failed to create pigpio wave: ${waveId}`);
    }

    try {
      for (
        let repetition = 0;
        repetition < this.configuration.infraredRepeatCount;
        repetition++
      ) {
        await gpio.waveSendOnce(waveId);
        await this.waitWaveTransmission(gpio);
      }
    } finally {
      await gpio.waveDelete(waveId);
      await gpio.write(0);
    }
  }

  private async waitWaveTransmission(gpio: PigpioGpioInterface): Promise<void> {
    while ((await gpio.waveBusy()) === 1) {
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

  private async getGpio(): Promise<PigpioGpioInterface> {
    if (this.gpio) {
      return this.gpio;
    }

    const client = await this.getClient();
    this.gpio = client.gpio(this.configuration.infraredOutputGpio);
    return this.gpio;
  }

  private async getClient(): Promise<PigpioConnectionInterface> {
    if (this.client) {
      return this.client;
    }

    const pigpioModule = require('pigpio-client') as PigpioModuleInterface;
    if (!pigpioModule || typeof pigpioModule.pigpio !== 'function') {
      throw new Error('pigpio-client does not expose pigpio(options) factory');
    }

    const client = pigpioModule.pigpio({
      host: this.configuration.pigpioHost,
      port: this.configuration.pigpioPort,
    });

    await this.waitForConnection(client);
    this.client = client;
    return client;
  }

  private async waitForConnection(
    client: PigpioConnectionInterface,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      client.once('connected', () => resolve());
      client.once('error', (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'unknown_connection_error';
        reject(
          new Error(
            `Cannot connect to pigpio endpoint ${this.configuration.pigpioHost}:${this.configuration.pigpioPort}. ${message}`,
          ),
        );
      });
    });
  }
}
