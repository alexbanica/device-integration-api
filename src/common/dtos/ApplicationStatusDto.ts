import { ApplicationStatus } from '../enums/ApplicationStatus';

export class ApplicationStatusDto {
  public readonly status: ApplicationStatus;
  public readonly uptime: number;
  public readonly timestamp: Date;
  public readonly dependencies: { [key: string]: string };

  public constructor() {
    this.status = ApplicationStatus.UP;
    this.uptime = process.uptime();
    this.timestamp = new Date();
    this.dependencies = {};
  }

  public addDependency(name: string, status: ApplicationStatus): void {
    if (status === ApplicationStatus.DOWN) {
      (this.status as ApplicationStatus) = ApplicationStatus.DOWN;
    }
    if (this.dependencies) {
      (this.dependencies as { [key: string]: string })[name] = status;
    } else {
      (this.dependencies as { [key: string]: string }) = { [name]: status };
    }
  }
}
