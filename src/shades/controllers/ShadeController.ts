import { Express, Request, Response } from 'express';
import { ErrorResponse } from '../../common/controllers/responses/ErrorResponse';
import { ShadeServiceInterface } from '../services/ShadeServiceInterface';
import { ShadeBusyError } from '../services/ShadeBusyError';

export class ShadeController {
  constructor(
    app: Express,
    private readonly service: ShadeServiceInterface,
  ) {
    app.post('/api/v1/shades/backyard/up', (_req: Request, res: Response) =>
      this.respond(this.service.up(), res),
    );
    app.post('/api/v1/shades/backyard/down', (_req: Request, res: Response) =>
      this.respond(this.service.down(), res),
    );
    app.post('/api/v1/shades/backyard/my', (_req: Request, res: Response) =>
      this.respond(this.service.my(), res),
    );
  }
  private respond(operation: Promise<void>, res: Response): void {
    operation
      .then(() => res.status(202).send())
      .catch((error: unknown) => {
        if (error instanceof ShadeBusyError)
          res
            .status(409)
            .send(new ErrorResponse('Shade command is already running'));
        else res.status(500).send(new ErrorResponse('Shade command failed'));
      });
  }
}
