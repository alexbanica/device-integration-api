export class FanConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FanConfigurationError';
  }
}
