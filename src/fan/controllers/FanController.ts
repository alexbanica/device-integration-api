import { Express, Request, Response } from 'express';
import { ErrorResponse } from '../../common/controllers/responses/ErrorResponse';
import { FanServiceInterface } from '../services/FanServiceInterface';
import { FanStateResponse } from './responses/FanStateResponse';
import { SetFanSpeedRequest } from './requests/SetFanSpeedRequest';

export class FanController {
  private readonly app: Express;
  private readonly fanService: FanServiceInterface;

  constructor(app: Express, service: FanServiceInterface) {
    this.app = app;
    this.fanService = service;
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.app.get('/api/v1/fan/state', (req: Request, res: Response) => {
      const state = this.fanService.getState();
      res.status(200).send(new FanStateResponse(state));
    });

    this.app.post('/api/v1/fan/start', (req: Request, res: Response) => {
      this.fanService
        .start()
        .then(() => res.status(202).send())
        .catch((error: Error) =>
          res.status(500).send(new ErrorResponse(error.message)),
        );
    });

    this.app.post('/api/v1/fan/rotate', (req: Request, res: Response) => {
      this.fanService
        .rotate()
        .then(() => res.status(202).send())
        .catch((error: Error) =>
          res.status(500).send(new ErrorResponse(error.message)),
        );
    });

    this.app.post('/api/v1/fan/stop', (req: Request, res: Response) => {
      this.fanService
        .stop()
        .then(() => res.status(202).send())
        .catch((error: Error) =>
          res.status(500).send(new ErrorResponse(error.message)),
        );
    });

    this.app.put('/api/v1/fan/speed/:speed', (req: Request, res: Response) => {
      try {
        const speedParameter = Array.isArray(req.params.speed)
          ? req.params.speed[0]
          : req.params.speed;
        const speedRequest =
          SetFanSpeedRequest.fromRouteParameter(speedParameter);

        this.fanService
          .setSpeed(speedRequest.speed)
          .then(() => res.status(202).send())
          .catch((error: Error) =>
            res.status(500).send(new ErrorResponse(error.message)),
          );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Invalid request';
        res.status(400).send(new ErrorResponse(message));
      }
    });
  }
}
