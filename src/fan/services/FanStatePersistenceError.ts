export class FanStatePersistenceError extends Error {
  public readonly cause?: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'FanStatePersistenceError';
    this.cause = cause;
  }
}
