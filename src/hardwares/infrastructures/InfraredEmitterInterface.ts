export interface InfraredEmitterInterface {
  emitFromFile(filePath: string): Promise<void>;
}
