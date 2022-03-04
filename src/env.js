/* eslint-disable prettier/prettier */
import { config } from 'dotenv';

// Import the environment variables for configuration
const env = config();

// error messages
const errNotFound = 'ConfigurationError: no .env configuration file was found.' +
' Tip: create your .env configuration file from the .env.example in the project base folder';

const errNoHttpsVars = 'ConfigurationError: ENABLE_HTTPS=true requires ' +
'SSL_PRIVATE_KEY, SSL_CERTIFICATE to be set.';

const errNoSecret = 'ConfigurationError: variable JWT_SECRET is required';

const errNoDbVars = 'ConfigurationError: ENABLE_DB=true requires ' +
'DB_NAME,DB_HOST,DB_USER,DB_PORT to be set';

const errClusterSettings = 'ConfigurationError: remote cluster settings' +
' are missing. Variables CLUSTER_NAME,CLUSTER_ADDRESS,CLUSTER_SSH_PORT,' +
'CLUSTER_USERS_SSH_KEY_LOCATION are required';

function loadConfiguration() {
  if (env.error) {
    throw errNotFound;
  }
  console.log('Conguration file .env found:');
  const e = env.parsed;
  if (env.parsed.ENABLE_HTTPS === 'true') {
    console.log('\tHTTPS enabled');
    if (!e.SSL_PRIVATE_KEY || !e.SSL_CERTIFICATE) {
      throw errNoHttpsVars;
    }
  } else {
    console.log('\tHTTPS not enabled -> HTTP');
  }

  // check JWT_SECRET
  if (!e.JWT_SECRET) throw errNoSecret;

  // check that is database properly set
  if (e.ENABLE_DB === 'true') {
    console.log('\tDatabase enabled');
    if (!e.DB_NAME || !e.DB_HOST || !e.DB_PORT || e.DB_USER) {
      throw errNoDbVars;
    }
  } else {
    console.log('\tDatabase disabled');
  }
  // check cluster settings
  if (
    !e.CLUSTER_NAME ||
    !e.CLUSTER_ADDRESS ||
    !e.CLUSTER_SSH_PORT ||
    !e.CLUSTER_USERS_SSH_KEY_LOCATION
  ) {
    throw errClusterSettings;
  }
  console.log(`\tCluster ${e.CUSTER_NAME} settings:`);
  console.log(`\t\taddress: ${e.CLUSTER_ADDRESS}:${e.CLUSTER_PORT}`);
  console.log(`\t\tPrivate keys stored at: ${e.CLUSTER_USERS_SSH_KEY_LOCATION}\n`);
}

export default loadConfiguration;
