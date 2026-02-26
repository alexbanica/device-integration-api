import { VentilatorStateDto } from '../dtos/VentilatorStateDto';

export interface VentilatorServiceInterface {
  start(): Promise<void>;
  stop(): Promise<void>;
  rotate(): Promise<void>;
  setSpeed(desiredSpeed: number): Promise<void>;
  getState(): VentilatorStateDto;
}
