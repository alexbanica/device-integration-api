import express, { Express } from 'express';
import dotenv from 'dotenv';
import { register_fan_module } from './fan/fan';
import { register_common_module } from './common/common';

dotenv.config();

const PORT = process.env.NPM_SERVER_PORT || 3000;
const app = express();

async function register_modules(app: Express): Promise<void> {
  register_common_module(app);
  await register_fan_module(app, process.env);
}

register_modules(app)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error(error.message);
    process.exit(1);
  });
