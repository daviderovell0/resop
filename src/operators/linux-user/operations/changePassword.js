import Operation from '../../../backend/Operation';

const opn = new Operation();

opn.setDescription(
  'changes a password for a Linux user (verify for distro compatibility)'
);

opn.defineOptions({
  username: 'linux account username',
  password: 'password',
});

// can define a custom function
async function exec() {
  if (!opn.options.password || !opn.options.username) {
    opn.error('username or password fields are empty');
  }

  opn.addLog('Hash generation: MD5...');

  const passwordHash = await opn.runOperationAsync('linux-user', 'hashMD5', {
    password: opn.options.password,
    escapeChar: 'true',
  });
  // escaping dollar characters created with MD5 encryption
  opn.addLog('changing password...');
  await opn.runCommand(
    `usermod --password "${passwordHash}" ${opn.options.username}`
  );
  opn.addLog('done');
  return 'password changed';
}

opn.set(exec);

export default opn;
