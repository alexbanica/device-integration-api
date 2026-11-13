export class ShadeExecutionResultDto {
  constructor(
    public readonly successful: boolean,
    public readonly safeToContinue: boolean,
  ) {}
}
