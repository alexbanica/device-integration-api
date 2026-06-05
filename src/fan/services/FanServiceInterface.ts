import { FanStateDto } from '../dtos/FanStateDto';

export interface FanServiceInterface {
  start(): Promise<void>;
  stop(): Promise<void>;
  rotate(): Promise<void>;
  setSpeed(desiredSpeed: number): Promise<void>;
  getState(): FanStateDto;
}
