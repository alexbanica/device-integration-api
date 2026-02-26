import { Express, Request, Response } from 'express';
import { ApplicationStatusDto } from '../dtos/ApplicationStatusDto';
import { ApplicationStatus } from '../enums/ApplicationStatus';

export class ApplicationController {
  private readonly app: Express;

  constructor(app: Express) {
    this.app = app;
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.app.get('/api/v1/health', (req: Request, res: Response) => {
      const status = this.getApplicationStatus();
      if (status.status === ApplicationStatus.DOWN) {
        res.status(503).send(status);
        return;
      }
      res.status(200).send(status);
    });
  }

  private getApplicationStatus(): ApplicationStatusDto {
    return new ApplicationStatusDto();
  }
}
