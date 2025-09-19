import { Express, Request, Response } from 'express';
import { ApplicationStatusDto } from '../dtos/ApplicationStatusDto';

export class ApplicationController {
  private readonly app: Express;

  constructor(app: Express) {
    this.app = app;
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.app.get('/health', (req: Request, res: Response) => {
      const status = this.getApplicationStatus();
      if (status.status === 'DOWN') {
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
