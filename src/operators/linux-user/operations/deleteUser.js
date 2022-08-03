import Operation from '../../../backend/Operation';

const opn = new Operation();

opn.setDescription(
  'Deletes a user in a Linux system (verify for distro compatibility)'
);

opn.defineOptions({
  username: 'linux account username',
});

// can define a custom function
function exec() {
  if (!opn.options.username) {
    opn.error('username field is empty');
  }

  opn.addLog('Deleting user...');
  const stdout = opn.runCommand(`userdel -f -r ${opn.options.username}`);
  opn.addLog('done');
  return `user deleted. stdout: ${stdout}`;
}

opn.set(exec);

export default opn;
