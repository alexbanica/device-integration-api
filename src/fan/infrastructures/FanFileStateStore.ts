import { basename, dirname, join } from 'node:path';
import { FanStateDto } from '../dtos/FanStateDto';
import { FanStatePersistenceError } from '../services/FanStatePersistenceError';
import { FanStateStoreInterface } from '../services/FanStateStoreInterface';
import { FanStateValidator } from '../services/FanStateValidator';
import { FanFileStateStoreFileSystemInterface } from './FanFileStateStoreFileSystemInterface';
import { NodeFanFileStateStoreFileSystem } from './NodeFanFileStateStoreFileSystem';

export class FanFileStateStore implements FanStateStoreInterface {
  private readonly stateFilePath: string;
  private readonly fileSystem: FanFileStateStoreFileSystemInterface;
  private readonly temporaryFileSuffixProvider: () => string;

  public constructor(
    stateFilePath: string,
    fileSystem: FanFileStateStoreFileSystemInterface = new NodeFanFileStateStoreFileSystem(),
    temporaryFileSuffixProvider: () => string = () =>
      `${process.pid}.${Date.now()}`,
  ) {
    this.stateFilePath = stateFilePath;
    this.fileSystem = fileSystem;
    this.temporaryFileSuffixProvider = temporaryFileSuffixProvider;
  }

  public async load(): Promise<FanStateDto> {
    try {
      const contents = await this.fileSystem.readFile(this.stateFilePath);
      return FanStateValidator.validatePersistedState(JSON.parse(contents));
    } catch (error) {
      if (this.isMissingFileError(error)) {
        const defaultState = FanStateValidator.defaultState();
        await this.save(defaultState);
        return defaultState;
      }

      if (error instanceof FanStatePersistenceError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new FanStatePersistenceError(
          'Fan state persistence error: state file must contain valid JSON',
          error,
        );
      }

      throw new FanStatePersistenceError(
        'Fan state persistence error: failed to load state file',
        error,
      );
    }
  }

  public async save(state: FanStateDto): Promise<void> {
    const directory = dirname(this.stateFilePath);
    const temporaryFilePath = join(
      directory,
      `.${basename(this.stateFilePath)}.${this.temporaryFileSuffixProvider()}.tmp`,
    );

    try {
      await this.fileSystem.mkdir(directory);
      await this.fileSystem.writeFile(
        temporaryFilePath,
        this.serializeState(state),
      );
      await this.fileSystem.rename(temporaryFilePath, this.stateFilePath);
    } catch (error) {
      if (error instanceof FanStatePersistenceError) {
        throw error;
      }
      throw new FanStatePersistenceError(
        'Fan state persistence error: failed to save state file',
        error,
      );
    }
  }

  private serializeState(state: FanStateDto): string {
    const persistedState = FanStateValidator.toPersistedState(state);
    FanStateValidator.validatePersistedState(persistedState);
    return `${JSON.stringify(persistedState, null, 2)}\n`;
  }

  private isMissingFileError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }
}
