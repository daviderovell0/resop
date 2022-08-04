import Operation from '../../../backend/Operation';

const opn = new Operation();

opn.setDescription(
  'hashing a string with MD5 algorithm. Suitable for a Linux user password hash'
);

opn.defineOptions({
  password: 'string - password to hash with MD5 algorithm',
  escapeChar:
    'string: true, false. Escape the dollar characters generated, ' +
    'needed if saved to linux user account',
});

// can define a custom function
function exec() {
  if (!opn.options.password) {
    opn.error('password field is empty');
  }

  // check if escape char is valid
  if (opn.options.escapeChar === 'true') opn.options.escapeChar = true;
  else if (
    opn.options.escapeChar === 'false' ||
    opn.options.escapeChar === null
  ) {
    opn.options.escapeChar = false;
  } else opn.error('invalid escapeChar type');

  // opn.error('test');
  opn.addLog('Hash generation: MD5...');
  let passwordHash = opn.runCommand(
    `openssl passwd -1 ${opn.options.password}`
  );
  if (opn.options.escapeChar) {
    opn.addLog('adding escape characters...');
    // escaping dollar characters created with MD5 encryption
    passwordHash = passwordHash.replaceAll('$', '\\$');
  }
  return passwordHash;
}

opn.set(exec);

export default opn;
