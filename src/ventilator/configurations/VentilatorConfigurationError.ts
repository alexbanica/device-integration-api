export class VentilatorConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VentilatorConfigurationError';
  }
}
