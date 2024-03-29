import Operation from '../../../backend/Operation';
import * as hashMD5 from '../../linux-user/operations/hashMD5';

const opn = new Operation();

opn.setDescription(
  'changes a password for a Linux user (verify for distro compatibility)'
);

opn.defineOptions({
  username: 'linux account username',
  password: 'password',
});

// can define a custom function
function exec() {
  if (!opn.options.password || !opn.options.username) {
    opn.error('username or password fields are empty');
  }

  opn.addLog('Hash generation: MD5...');

  const passwordHash = opn.runOperation(hashMD5, {
    password: opn.options.password,
    escapeChar: 'true',
  });
  // escaping dollar characters created with MD5 encryption
  opn.addLog('changing password...');
  opn.runCommand(
    `/usr/sbin/usermod --password "${passwordHash}" ${opn.options.username}`
  );
  opn.addLog('done');
  return 'password changed';
}

opn.set(exec);

export default opn;
