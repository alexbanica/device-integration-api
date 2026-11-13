import { ChildProcess, spawn } from 'node:child_process';
import { ShadeTerminalExecutorInterface } from './ShadeTerminalExecutorInterface';

export class ShadeProcessTerminal implements ShadeTerminalExecutorInterface {
  private static readonly COMMAND_TIMEOUT_MS = 5000;
  private static readonly TERM_GRACE_MS = 250;
  private static readonly CLEANUP_CONFIRMATION_MS = 750;
  private static readonly CLEANUP_POLL_MS = 25;

  private quarantined = false;

  public isQuarantined(): boolean {
    return this.quarantined;
  }

  public async execute(
    command: string,
    workingDirectory: string,
  ): Promise<number> {
    if (this.quarantined) return 1;

    return new Promise((resolve) => {
      let child: ChildProcess;
      try {
        child = spawn('/bin/sh', ['-c', command], {
          cwd: workingDirectory,
          detached: true,
          stdio: 'ignore',
        });
      } catch {
        resolve(1);
        return;
      }

      const pid = child.pid;
      let childClosed = false;
      let exitCode = 1;
      let timedOut = false;
      let settled = false;
      let cleanupStarted = false;
      const timers = new Set<ReturnType<typeof setTimeout>>();

      const schedule = (callback: () => void, delayMs: number) => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          if (!settled) callback();
        }, delayMs);
        timers.add(timer);
      };

      const settle = (code: number) => {
        if (settled) return;
        settled = true;
        for (const timer of timers) clearTimeout(timer);
        timers.clear();
        resolve(code);
      };

      const signalGroup = (signal: NodeJS.Signals) => {
        if (!pid || settled) return;
        try {
          process.kill(-pid, signal);
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (code !== 'ESRCH') this.quarantined = true;
        }
      };

      const groupExists = (): boolean => {
        if (!pid) return false;
        try {
          process.kill(-pid, 0);
          return true;
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (code === 'ESRCH') return false;
          this.quarantined = true;
          return true;
        }
      };

      const beginCleanup = () => {
        if (!childClosed || cleanupStarted || settled) return;
        cleanupStarted = true;

        if (!pid) {
          settle(1);
          return;
        }

        if (!groupExists()) {
          settle(timedOut || exitCode !== 0 ? 1 : 0);
          return;
        }

        signalGroup('SIGTERM');
        schedule(
          () => signalGroup('SIGKILL'),
          ShadeProcessTerminal.TERM_GRACE_MS,
        );
        schedule(() => {
          this.quarantined = true;
          settle(1);
        }, ShadeProcessTerminal.TERM_GRACE_MS + ShadeProcessTerminal.CLEANUP_CONFIRMATION_MS);

        const confirmAbsence = () => {
          if (settled) return;
          if (!groupExists()) {
            settle(timedOut || exitCode !== 0 ? 1 : 0);
            return;
          }
          schedule(confirmAbsence, ShadeProcessTerminal.CLEANUP_POLL_MS);
        };
        schedule(confirmAbsence, ShadeProcessTerminal.CLEANUP_POLL_MS);
      };

      // Always consume spawn errors, including when Node did not assign a PID.
      child.once('error', () => {
        exitCode = 1;
      });
      child.once('close', (code) => {
        childClosed = true;
        exitCode = code === 0 ? 0 : 1;
        beginCleanup();
      });

      schedule(() => {
        timedOut = true;
        signalGroup('SIGTERM');
        schedule(
          () => signalGroup('SIGKILL'),
          ShadeProcessTerminal.TERM_GRACE_MS,
        );
        schedule(() => {
          this.quarantined = true;
          settle(1);
        }, ShadeProcessTerminal.TERM_GRACE_MS + ShadeProcessTerminal.CLEANUP_CONFIRMATION_MS);
        beginCleanup();
      }, ShadeProcessTerminal.COMMAND_TIMEOUT_MS);
    });
  }
}
