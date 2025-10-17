import { Express, Request, Response } from 'express';
import { VentilatorService } from '../services/VentilatorService';
import { VentilatorStateDto } from '../dtos/VentilatorStateDto';
import { ErrorResponse } from '../../common/controllers/responses/ErrorResponse';

export class VentilatorController {
  private readonly app: Express;
  private readonly ventilatorService: VentilatorService;

  constructor(app: Express, service: VentilatorService) {
    this.app = app;
    this.ventilatorService = service;
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.app.get('/api/ventilator/state', (req: Request, res: Response) => {
      const ventilatorState = this.getState();
      res.status(200).send(ventilatorState);
    });

    this.app.post('/api/ventilator/start', (req: Request, res: Response) => {
      this.start()
        .then(() => res.status(202).send())
        .catch((error) =>
          res.status(500).send(new ErrorResponse(error.message)),
        );
    });

    this.app.post('/api/ventilator/rotate', (req: Request, res: Response) => {
      this.rotate()
        .then(() => res.status(202).send())
        .catch((error) =>
          res.status(500).send(new ErrorResponse(error.message)),
        );
    });

    this.app.post('/api/ventilator/stop', (req: Request, res: Response) => {
      this.stop()
        .then(() => res.status(202).send())
        .catch((error) =>
          res.status(500).send(new ErrorResponse(error.message)),
        );
    });

    this.app.put(
      '/api/ventilator/speed/:speed',
      (req: Request, res: Response) => {
        const speed = parseInt(req.params.speed, 10);

        if (isNaN(speed) || speed < 1 || speed > 3) {
          return res
            .status(400)
            .json({ error: 'Speed must be a number between 1 and 3.' });
        }

        this.setSpeed(speed)
          .then(() => res.status(202).send())
          .catch((error) => res.status(500).send(error));
      },
    );
  }

  private async start(): Promise<void> {
    await this.ventilatorService.start();
  }

  private async rotate(): Promise<void> {
    await this.ventilatorService.rotate();
  }

  private async stop(): Promise<void> {
    await this.ventilatorService.stop();
  }

  private async setSpeed(speed: number): Promise<void> {
    await this.ventilatorService.setSpeed(speed);
  }

  private getState(): VentilatorStateDto {
    return this.ventilatorService.ventilatorState;
  }
}
