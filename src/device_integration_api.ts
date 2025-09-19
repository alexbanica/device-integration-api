import express, { Express } from 'express';
import dotenv from 'dotenv';
import { register_ventilator_module } from './ventilator/ventilator';
import { register_common_module } from './common/common';

dotenv.config();

const PORT = process.env.NPM_SERVER_PORT || 3000;
const app = express();

function register_modules(app: Express) {
  register_common_module(app);
  register_ventilator_module(app, process.env);
}

register_modules(app);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
