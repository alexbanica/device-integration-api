export class ErrorResponse extends Error {
  public readonly message: string;
  public readonly timestamp: string;

  constructor(message: string) {
    super(message);
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  public toJSON(): { message: string; timestamp: string } {
    return {
      message: this.message,
      timestamp: this.timestamp,
    };
  }
}
