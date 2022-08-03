import * as fs from 'fs';
import Operation from '../../../backend/Operation';
import SSHUtils from '../../../backend/SSHUtils';

const opn = new Operation();

opn.setDescription('Transfer file from the remote cluster to resop server');

opn.defineOptions({
  source: 'full path (or relative path to $HOME to remote file',
  destination: 'full path to local folder/file',
});

function exec() {
  opn.noEmptyOptions();
  opn.noNullOptions();

  const sshell = new SSHUtils();

  // check if source is a file
  let retobj = sshell.exec(`test -f ${opn.options.source}`, opn.user);
  if (!retobj.success) {
    // append filename
    opn.error(`${opn.options.source} not a file`);
  }

  // if dest is an existing local dir, append source filename
  if (fs.existsSync(opn.options.destination)) {
    let idx = opn.options.source.lastIndexOf('/') + 1;
    if (idx === -1) idx = 0;
    const filename = opn.options.source.slice(idx, opn.options.source.length);
    opn.options.destination += `/${filename}`;
    console.log(opn.options.destination);
  }

  retobj = sshell.scpRecv(
    opn.options.source,
    opn.options.destination,
    opn.user
  );

  if (!retobj.success) {
    // else throw generic error
    opn.error(retobj.output);
  }

  return retobj.output;
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
