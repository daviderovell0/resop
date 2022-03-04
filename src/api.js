// REQUIRED MODULES:
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import 'regenerator-runtime/runtime.js';
import { readFileSync } from 'fs';
import https from 'https';
import http from 'http';

// configuration before setting the api
import loadConfiguration from './env';

loadConfiguration();

// Custom middlewares
import routes from './routes';
import sequelize from './models';
import auth from './auth';

let credentials = null;

if (process.env.ENABLE_HTTPS === 'true') {
  try {
    const privateKey = readFileSync(process.env.SSL_PRIVATE_KEY, 'utf8');
    const certificate = readFileSync(process.env.SSL_CERTIFICATE, 'utf8');
    credentials = { key: privateKey, cert: certificate };
  } catch (e) {
    const errLoadHTTPS =
      `HTTPSCertificateError: ${e.message}. Check the ` +
      ' SSL variables in the configuration file .env';
    throw errLoadHTTPS;
  }
}

// LOAD MIDDLEWARE
const api = express();

api.use(cors()); // module to allow access from external from a foreign domain! TODO: whitelist
api.use(helmet());
api.use(express.json());
api.use(express.urlencoded({ extended: true }));

if (process.env.IN_PROD === 'true') {
  // Disable auth on non-production envs
  console.log('Using authentication');
  api.use(auth.authenticate());
}

// sync models to database
if (process.env.ENABLE_DB === 'true') {
  sequelize.sync({ logging: false }).then(
    () => {
      console.log('Connected to the database');
    },
    (err) => {
      console.log(
        'Error: could not connect to the database. To disable the' +
          ' database set ENABLE_DB to false in the configuration file.'
      );
      console.log(err);
      process.exit(1);
    }
  );
}

api.use(routes);
const server =
  process.env.ENABLE_HTTPS === 'true'
    ? https.createServer(credentials, api)
    : http.createServer(api);

// Start the server
server.listen(3000, () => {
  if (process.env.ENABLE_HTTPS === 'true') {
    console.info('\nRESOP-API server started at https://localhost:3000\n');
  } else {
    console.info('\nRESOP-API server started at http://localhost:3000\n');
  }
});
