import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";

const execPromise = promisify(exec);

export class LocalMachineTerminal {
    public async execute(command: string, workingDirectory: string): Promise<number> {
        console.info(`Executing command: ${command}`);

        try {
            if (!fs.existsSync(workingDirectory) || !fs.lstatSync(workingDirectory).isDirectory()) {
                console.error(`Invalid working directory: ${workingDirectory}`);
                return 1;
            }

            const { stdout, stderr } = await execPromise(command, { cwd: workingDirectory });

            if (stdout) {
                console.info(`Output: ${stdout}`);
            }
            if (stderr) {
                console.error(`Error output: ${stderr}`);
            }

            console.info("Command executed successfully.");
            return 0;
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Error while executing command: ${error.message}`);
            } else {
                console.error("Unknown error occurred while executing command.");
            }
            return 1;
        }
    }
}