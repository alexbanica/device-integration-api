export class ShadeBusyError extends Error {
  constructor() {
    super('Shade command is already running');
    this.name = 'ShadeBusyError';
  }
}
