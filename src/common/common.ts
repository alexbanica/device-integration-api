import { Express } from 'express';
import { ApplicationController } from './controllers/ApplicationController';

function register_common_module(app: Express) {
  new ApplicationController(app);
}

export { register_common_module };
