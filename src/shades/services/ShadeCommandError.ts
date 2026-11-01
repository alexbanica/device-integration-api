export class ShadeCommandError extends Error {
  constructor() {
    super('Shade command failed');
    this.name = 'ShadeCommandError';
  }
}
