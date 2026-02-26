export interface TerminalExecutorInterface {
  execute(command: string, workingDirectory: string): Promise<number>;
}
