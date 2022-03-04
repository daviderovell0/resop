/* eslint-disable prettier/prettier */
import Operation from '../../../backend/Operation';
/**
 * @summary Description
 */

const opn = new Operation();

opn.setDescription(
  'Extract the salt used by the LDAP password encryption algorithm for'
  + 'a specific password. Uses standard SSHA encryption alogrithm. Used for testing purposes'
);

opn.defineOptions({
  password: 'SSHA1 encrpyted password, format {SSHA}longhashhere123456431232',
});

// LDAP pwd gen. algorithm: base64encode( SHA1(password + salt) + salt).
// salt extraction: base64decode(pwd) -> remove 1st 20 bytes ->  base64encode() for visibility
async function exec() {
  if (!opn.options.password || opn.options.password === '') opn.error('field password cannot be null');

  const trimPasswd = opn.options.password.slice(6, opn.options.password.length);
  // encode
  const buf = Buffer.from(trimPasswd, 'base64');
  const salt = buf.slice(20, buf.length);
  return salt.toString('base64');
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
