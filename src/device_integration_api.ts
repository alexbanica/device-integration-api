import express, {Express} from 'express';
import dotenv from 'dotenv';
import {register_ventilator_module} from "./ventilator/ventilator";

dotenv.config();

const PORT = process.env.NPM_SERVER_PORT || 3000;
const app = express();

function register_modules(app: Express) {
    register_ventilator_module(app, process.env);
}

register_modules(app)

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
