import { Express } from 'express';
import { FanConfiguration } from './configurations/FanConfiguration';
import { FanController } from './controllers/FanController';
import { FanService } from './services/FanService';
import { FanTerminalGateway } from './infrastructures/FanTerminalGateway';
import { LocalMachineTerminal } from '../common/infrastructures/LocalMachineTerminal';

function register_fan_module(
  app: Express,
  env: NodeJS.Dict<string> = process.env,
) {
  const configuration = new FanConfiguration(env);
  const terminal = new LocalMachineTerminal();
  const gateway = new FanTerminalGateway(terminal, configuration);
  const service = new FanService(gateway);
  new FanController(app, service);
}

export { register_fan_module };
