import { Express } from 'express';
import { VentilatorConfiguration } from './configurations/VentilatorConfiguration';
import { VentilatorController } from './controllers/VentilatorController';
import { VentilatorService } from './services/VentilatorService';
import { VentilatorTerminalGateway } from './infrastructures/VentilatorTerminalGateway';
import { InfraredHardwareConfiguration } from '../hardwares/configurations/InfraredHardwareConfiguration';
import { PigpioClientInfraredEmitter } from '../hardwares/infrastructures/PigpioClientInfraredEmitter';
import { InfraredHardwareCommandExecutor } from '../common/infrastructures/InfraredHardwareCommandExecutor';

function register_ventilator_module(
  app: Express,
  env: NodeJS.Dict<string> = process.env,
) {
  const ventilatorConfiguration = new VentilatorConfiguration(env);
  const infraredHardwareConfiguration = new InfraredHardwareConfiguration(env);
  const infraredEmitter = new PigpioClientInfraredEmitter(
    infraredHardwareConfiguration,
  );
  const commandExecutor = new InfraredHardwareCommandExecutor(infraredEmitter);
  const gateway = new VentilatorTerminalGateway(
    commandExecutor,
    ventilatorConfiguration,
  );
  const service = new VentilatorService(gateway);
  new VentilatorController(app, service);
}

export { register_ventilator_module };
