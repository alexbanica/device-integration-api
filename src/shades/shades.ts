import { Express } from 'express';
import { ShadeConfiguration } from './configurations/ShadeConfiguration';
import { ShadeController } from './controllers/ShadeController';
import { ShadeService } from './services/ShadeService';
import { ShadeTerminalGateway } from './infrastructures/ShadeTerminalGateway';
import { ShadeProcessTerminal } from './infrastructures/ShadeProcessTerminal';

export function register_shades_module(
  app: Express,
  env: NodeJS.Dict<string> = process.env,
): void {
  const configuration = new ShadeConfiguration(env);
  if (!configuration.enabled) return;
  new ShadeController(
    app,
    new ShadeService(
      new ShadeTerminalGateway(new ShadeProcessTerminal(), configuration),
    ),
  );
}
