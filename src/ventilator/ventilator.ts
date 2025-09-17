import {Express} from "express";
import {VentilatorConfiguration} from "./configurations/VentilatorConfiguration";
import {VentilatorController} from "./controllers/VentilatorController";
import {VentilatorService} from "./services/VentilatorService";
import {VentilatorTerminal} from "./infrastructure/VentilatorTerminal";

function register_ventilator_module(app: Express, env: NodeJS.Dict<string> = process.env) {
    const configuration = new VentilatorConfiguration(env);
    new VentilatorController(
        app,
        new VentilatorService(new VentilatorTerminal(configuration))
    )
}

export {register_ventilator_module};