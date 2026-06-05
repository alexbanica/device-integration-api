import { Express } from 'express';
import { FanConfiguration } from './configurations/FanConfiguration';
import { FanController } from './controllers/FanController';
import { FanService } from './services/FanService';
import { FanTerminalGateway } from './infrastructures/FanTerminalGateway';
import { LocalMachineTerminal } from '../common/infrastructures/LocalMachineTerminal';
import { FanFileStateStore } from './infrastructures/FanFileStateStore';

async function register_fan_module(
  app: Express,
  env: NodeJS.Dict<string> = process.env,
): Promise<void> {
  const configuration = new FanConfiguration(env);
  const terminal = new LocalMachineTerminal();
  const gateway = new FanTerminalGateway(terminal, configuration);
  const stateStore = new FanFileStateStore(configuration.fanStateFilePath);
  const initialState = await stateStore.load();
  const service = new FanService(gateway, stateStore, initialState);
  new FanController(app, service);
}

export { register_fan_module };
