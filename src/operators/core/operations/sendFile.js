import Operation from '../../../backend/Operation';
import SSHUtils from '../../../backend/SSHUtils';

const opn = new Operation();

opn.setDescription('Send a local file to the remote cluster');

opn.defineOptions({
  source: 'full path to local file',
  destination:
    'full path (or relative path to $HOME) to destination file or folder',
});

function exec() {
  opn.noEmptyOptions();
  opn.noNullOptions();

  const sshell = new SSHUtils();

  // check if destination is a directory
  let retobj = sshell.exec(`test -d ${opn.options.destination}`, opn.user);
  if (retobj.success) {
    // append filename
    let idx = opn.options.source.lastIndexOf('/') + 1;
    if (idx === -1) idx = 0;
    const filename = opn.options.source.slice(idx, opn.options.source.length);
    opn.options.destination += `/${filename}`;
    console.log(opn.options.destination);
  }

  retobj = sshell.scpSend(
    opn.options.source,
    opn.options.destination,
    opn.user
  );

  if (!retobj.success) {
    // attempy to create new empty file at given dest. to check possible errors
    const touch = sshell.exec(`touch ${opn.options.destination}`, opn.user);
    if (!touch.success) {
      const err = touch.output;
      console.log(err);
      // format touch output for clarity: take out inital touch...
      opn.error(
        opn.options.destination +
          err.slice(err.lastIndexOf(':'), err.length - 1)
      );
    }
    console.log('could touch new file but not send');
    // else throw generic error
    opn.error(retobj.output);
  }

  return retobj.output;
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
