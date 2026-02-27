export interface HardwareCommandExecutorInterface {
  execute(commandFilePath: string): Promise<number>;
}
