import { TerminalExecutorInterface } from '../../common/infrastructures/TerminalExecutorInterface';

export interface ShadeTerminalExecutorInterface extends TerminalExecutorInterface {
  isQuarantined(): boolean;
}
