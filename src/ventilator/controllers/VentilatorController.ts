import { Express, Request, Response } from 'express';
import { ErrorResponse } from '../../common/controllers/responses/ErrorResponse';
import { VentilatorServiceInterface } from '../services/VentilatorServiceInterface';
import { VentilatorStateResponse } from './responses/VentilatorStateResponse';
import { SetVentilatorSpeedRequest } from './requests/SetVentilatorSpeedRequest';

export class VentilatorController {
  private readonly app: Express;
  private readonly ventilatorService: VentilatorServiceInterface;

  constructor(app: Express, service: VentilatorServiceInterface) {
    this.app = app;
    this.ventilatorService = service;
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.app.get('/api/v1/ventilator/state', (req: Request, res: Response) => {
      const state = this.ventilatorService.getState();
      res.status(200).send(new VentilatorStateResponse(state));
    });

    this.app.post('/api/v1/ventilator/start', (req: Request, res: Response) => {
      this.ventilatorService
        .start()
        .then(() => res.status(202).send())
        .catch((error: Error) =>
          res.status(500).send(new ErrorResponse(error.message)),
        );
    });

    this.app.post('/api/v1/ventilator/rotate', (req: Request, res: Response) => {
      this.ventilatorService
        .rotate()
        .then(() => res.status(202).send())
        .catch((error: Error) =>
          res.status(500).send(new ErrorResponse(error.message)),
        );
    });

    this.app.post('/api/v1/ventilator/stop', (req: Request, res: Response) => {
      this.ventilatorService
        .stop()
        .then(() => res.status(202).send())
        .catch((error: Error) =>
          res.status(500).send(new ErrorResponse(error.message)),
        );
    });

    this.app.put('/api/v1/ventilator/speed/:speed', (req: Request, res: Response) => {
      try {
        const speedRequest = SetVentilatorSpeedRequest.fromRouteParameter(
          req.params.speed,
        );

        this.ventilatorService
          .setSpeed(speedRequest.speed)
          .then(() => res.status(202).send())
          .catch((error: Error) =>
            res.status(500).send(new ErrorResponse(error.message)),
          );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid request';
        res.status(400).send(new ErrorResponse(message));
      }
    });
  }
}
