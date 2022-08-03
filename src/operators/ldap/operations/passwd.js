import { createHash } from 'crypto';
import Operation from '../../../backend/Operation';
/**
 * @summary Description
 */

const opn = new Operation();

opn.setDescription(
  'Generate a LDAP compatible password, to be used with ldapadd / ldapmodify. ' +
    ' Equivalent of slappasswd. Encryption: SSHA'
);

// options in the POST request body, to be used in the Operation logic
opn.defineOptions({
  password: 'plain text password',
  salt: 'LDAP system salt for encryption',
});

// LDAP pwd gen. algorithm: base64encode( SHA1(password + salt) + salt)
function exec() {
  if (!opn.options.password || opn.options.password === '') {
    opn.error('field password cannot be null or empty');
  }
  if (!opn.options.salt || opn.options.salt === '') {
    opn.error('field salt cannot be null or empty');
  }

  const saltByte = Buffer.from(opn.options.salt, 'base64');
  // create the SHA1 hash object
  const c = createHash('sha1');
  // conversion in bytes
  c.update(Buffer.from(opn.options.password, 'utf8'));

  c.update(saltByte);
  const hash = c.digest();
  // creating hash
  const hashWithSalt = Buffer.concat([hash, saltByte]);
  // encoding in base64
  return `{SSHA}${hashWithSalt.toString('base64')}`;
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
