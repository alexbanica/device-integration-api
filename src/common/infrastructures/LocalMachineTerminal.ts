import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import path from 'node:path';
import { TerminalExecutorInterface } from './TerminalExecutorInterface';

const execPromise = promisify(exec);

export class LocalMachineTerminal implements TerminalExecutorInterface {
  private static readonly COMMAND_TIMEOUT_MS = 5000;

  public async execute(
    command: string,
    workingDirectory: string,
  ): Promise<number> {
    this.log('command_start', { command, workingDirectory });

    try {
      if (
        !fs.existsSync(workingDirectory) ||
        !fs.lstatSync(workingDirectory).isDirectory()
      ) {
        this.log('command_validation_failed', {
          reason: 'invalid_working_directory',
          workingDirectory,
        });
        return 1;
      }

      const [script] = command.split(' ');
      if (script.startsWith('./')) {
        const scriptPath = path.resolve(workingDirectory, script.substring(2));
        if (!fs.existsSync(scriptPath)) {
          this.log('command_validation_failed', {
            reason: 'script_not_found',
            scriptPath,
          });
          return 1;
        }
      }

      const { stdout, stderr } = await execPromise(command, {
        cwd: workingDirectory,
        timeout: LocalMachineTerminal.COMMAND_TIMEOUT_MS,
      });

      this.log('command_complete', { stdout, stderr });
      return 0;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'unknown_error';
      this.log('command_failed', { error: errorMessage, command });
      return 1;
    }
  }

  private log(event: string, details: Record<string, unknown>): void {
    console.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event,
        details,
      }),
    );
  }
}
