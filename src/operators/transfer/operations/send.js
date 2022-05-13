import Operation from '../../../backend/Operation';
import SSHUtils from '../../../backend/SSHUtils';

const opn = new Operation();

opn.setDescription('Send a local file to the remote cluster');

opn.defineOptions({
  source: 'full path (or relative path to run directory) to local file',
  destination:
    'full path (or relative path to $HOME) to destination file. Folder not supported',
});

function exec() {
  const sshell = new SSHUtils();

  return sshell.scpSend(opn.options.source, opn.options.destination, opn.user);
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
