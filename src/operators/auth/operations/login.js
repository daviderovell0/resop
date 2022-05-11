import jwt from 'jsonwebtoken';
import shell from 'shelljs';
import jsSHA from 'jssha';
import SSH2Agent from '../../../backend/SSH2Agent';
import SSHUtils from '../../../backend/SSHUtils';
import Operation from '../../../backend/Operation';

/**
 * @desc Attempts to log in a user in the remote cluster
 * via SSH with username and password. If successful,
 * creates a password-pretected private key for future acceses
 * and returns a JWT containing session details:
 * key path, key passphrase, username
 */

const opn = new Operation();

opn.setDescription(
  'login to the cluster API, get a JWT to authenticate for protected API calls'
);

opn.defineOptions({
  username: 'cluster username',
  password: 'cluster password',
});

function exec() {
  opn.noEmptyOptions();
  opn.noNullOptions();

  // const ssh = new SSH2Agent();
  const sshell = new SSHUtils();
  opn.addLog(`user ${opn.options.username} attempting to login...`);
  let success = sshell.attempt(opn.options.username, opn.options.password);
  if (!success) {
    opn.error('Invalid credentials');
  }
  // create unique key filename specific to the user
  // this is done to avoid having a growing number of different keys
  // for the same user in future logins
  // eslint-disable-next-line new-cap
  const shaObj = new jsSHA('SHAKE128', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(opn.options.username);
  const keyFilename = shaObj.getHash('HEX', { outputLen: 64 });

  // create random 14-char string password to protect the key
  let keyPassphrase = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 14; i += 1) {
    keyPassphrase += characters.charAt(
      Math.floor(Math.random() * charactersLength)
    );
  }

  // generate SSH key: hashed keyfilename + rand password
  // store it locally in the given location (env config)
  const keyPath = `${process.env.CLUSTER_USERS_SSH_KEY_LOCATION}/${keyFilename}`;

  if (
    shell.exec(
      `ssh-keygen -f ${keyPath} -N ${keyPassphrase} -C "resop API key" <<<y`,
      { shell: '/bin/bash', silent: true }
    ).code !== 0
  ) {
    throw 'Error generating the SSH key during login proceure';
  }

  console.log(`generated key: ${keyPath}`);

  // copy the public key to the remote cluster
  success = sshell.copyID(
    opn.options.username,
    opn.options.password,
    `${keyPath}.pub`
  );
  if (!success) {
    opn.error('Error while copying the key to the remote cluster, check logs');
  }
  opn.addLog('successful login');

  console.log(`creating access token for user: ${opn.options.username}`);
  const token = jwt.sign(
    { username: opn.options.username, keyPath, keyPassphrase },
    process.env.JWT_SECRET
  );
  return token;
}

opn.set(exec);

// eslint-disable-next-line import/prefer-default-export
export { opn };
