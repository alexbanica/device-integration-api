export class ShadeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShadeConfigurationError';
  }
}
