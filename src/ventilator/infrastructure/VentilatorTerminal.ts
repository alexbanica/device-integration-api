import { VentilatorConfiguration } from "../configurations/VentilatorConfiguration";
import { LocalMachineTerminal } from "../../common/infrastructure/LocalMachineTerminal";

export class VentilatorTerminal {
    private readonly terminal: LocalMachineTerminal;
    private readonly configuration: VentilatorConfiguration;

    constructor(configuration: VentilatorConfiguration) {
        this.terminal = new LocalMachineTerminal();
        this.configuration = configuration;
    }

    public async start(): Promise<boolean> {
        try {
            const result = this.terminal.execute(
                this.configuration.ventilatorStartCommand,
                this.configuration.ventilatorWorkingDirectory
            );
            return (await result) === 0;
        } catch (error) {
            console.error("Error while starting ventilator:", error);
            return false;
        }
    }

    public async stop(): Promise<boolean> {
        try {
            const result = this.terminal.execute(
                this.configuration.ventilatorStopCommand,
                this.configuration.ventilatorWorkingDirectory
            );
            return (await result) === 0;
        } catch (error) {
            console.error("Error while stopping ventilator:", error);
            return false;
        }
    }

    public async setSpeed(speed: number): Promise<number> {
        let actualSpeed = 0;
        while (speed-- > 0) {
            try {
                await this.terminal.execute(
                    this.configuration.ventilatorSpeedCommand,
                    this.configuration.ventilatorWorkingDirectory
                );
                // Simulate delay
                setTimeout(() => {}, 1000);
                actualSpeed++;
            } catch (error) {
                console.error("Error while setting ventilator speed:", error);
            }
        }
        return actualSpeed;
    }

    public async rotate(): Promise<boolean> {
        try {
            const result = this.terminal.execute(
                this.configuration.ventilatorRotateCommand,
                this.configuration.ventilatorWorkingDirectory
            );
            return (await result) === 0;
        } catch (error) {
            console.error("Error while rotating ventilator:", error);
            return false;
        }
    }
}