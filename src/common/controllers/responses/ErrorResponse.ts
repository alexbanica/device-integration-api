export class ErrorResponse extends Error {
    public readonly message: string;
    public readonly timestamp: Date;

    constructor(message: string) {
        super(message);
        this.message = message;
        this.timestamp = new Date();
    }
}