import { FanStateDto } from '../dtos/FanStateDto';

export interface FanStateStoreInterface {
  load(): Promise<FanStateDto>;
  save(state: FanStateDto): Promise<void>;
}
