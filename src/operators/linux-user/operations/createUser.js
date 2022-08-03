import Operation from '../../../backend/Operation';

const opn = new Operation();

opn.setDescription(
  'Creates a user in a Linux system (verify for distro compatibility)'
);

opn.defineOptions({
  username: 'linux account username',
  password: 'password',
});

// can define a custom function
function exec() {
  opn.addLog('Hash generation: MD5...');
  let passwordHash = opn.runCommand(
    `openssl passwd -1 ${opn.options.password}`
  );

  passwordHash = passwordHash.replaceAll('$', '\\$');

  opn.addLog('creating user...');
  opn.runCommand(
    `useradd --password "${passwordHash}" ${opn.options.username}`
  );
  opn.addLog('done');
  return `user ${opn.options.username} created`;
}

opn.set(exec);

export default opn;
