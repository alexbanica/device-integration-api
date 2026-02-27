export class InfraredHardwareConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InfraredHardwareConfigurationError';
  }
}
