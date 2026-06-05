import { FanStateDto } from '../dtos/FanStateDto';
import { FanStatePersistenceError } from './FanStatePersistenceError';

type PersistedFanState = {
  isOn: boolean;
  speed: number;
  isRotating: boolean;
};

export class FanStateValidator {
  private static readonly PERSISTED_KEYS = ['isOn', 'speed', 'isRotating'];
  private static readonly MAX_SPEED = 3;

  public static defaultState(): FanStateDto {
    return new FanStateDto();
  }

  public static clone(state: FanStateDto): FanStateDto {
    const clone = new FanStateDto();
    clone.isOn = state.isOn;
    clone.speed = state.speed;
    clone.isRotating = state.isRotating;
    return clone;
  }

  public static toPersistedState(state: FanStateDto): PersistedFanState {
    return {
      isOn: state.isOn,
      speed: state.speed,
      isRotating: state.isRotating,
    };
  }

  public static validatePersistedState(value: unknown): FanStateDto {
    if (!this.isRecord(value)) {
      throw new FanStatePersistenceError(
        'Fan state persistence error: state file must contain a JSON object',
      );
    }

    const keys = Object.keys(value);
    if (
      keys.length !== this.PERSISTED_KEYS.length ||
      !this.PERSISTED_KEYS.every((key) => keys.includes(key))
    ) {
      throw new FanStatePersistenceError(
        'Fan state persistence error: state file must contain only isOn, speed, and isRotating',
      );
    }

    if (typeof value.isOn !== 'boolean') {
      throw new FanStatePersistenceError(
        'Fan state persistence error: isOn must be a boolean',
      );
    }
    if (!Number.isInteger(value.speed)) {
      throw new FanStatePersistenceError(
        'Fan state persistence error: speed must be an integer',
      );
    }
    if (typeof value.isRotating !== 'boolean') {
      throw new FanStatePersistenceError(
        'Fan state persistence error: isRotating must be a boolean',
      );
    }

    const persistedState = value as PersistedFanState;

    if (persistedState.speed < 0 || persistedState.speed > this.MAX_SPEED) {
      throw new FanStatePersistenceError(
        'Fan state persistence error: speed must be between 0 and 3',
      );
    }
    if (persistedState.speed === 0 && persistedState.isOn) {
      throw new FanStatePersistenceError(
        'Fan state persistence error: speed 0 requires isOn=false',
      );
    }
    if (!persistedState.isOn && persistedState.speed !== 0) {
      throw new FanStatePersistenceError(
        'Fan state persistence error: isOn=false requires speed=0',
      );
    }
    if (!persistedState.isOn && persistedState.isRotating) {
      throw new FanStatePersistenceError(
        'Fan state persistence error: isOn=false requires isRotating=false',
      );
    }

    const state = new FanStateDto();
    state.isOn = persistedState.isOn;
    state.speed = persistedState.speed;
    state.isRotating = persistedState.isRotating;
    return state;
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
