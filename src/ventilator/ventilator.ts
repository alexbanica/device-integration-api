import { Express } from 'express';
import { VentilatorConfiguration } from './configurations/VentilatorConfiguration';
import { VentilatorController } from './controllers/VentilatorController';
import { VentilatorService } from './services/VentilatorService';
import { VentilatorTerminalGateway } from './infrastructures/VentilatorTerminalGateway';
import { LocalMachineTerminal } from '../common/infrastructures/LocalMachineTerminal';

function register_ventilator_module(
  app: Express,
  env: NodeJS.Dict<string> = process.env,
) {
  const configuration = new VentilatorConfiguration(env);
  const terminal = new LocalMachineTerminal();
  const gateway = new VentilatorTerminalGateway(terminal, configuration);
  const service = new VentilatorService(gateway);
  new VentilatorController(app, service);
}

export { register_ventilator_module };
