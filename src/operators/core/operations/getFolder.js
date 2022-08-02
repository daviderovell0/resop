import * as fs from 'fs';
import Operation from '../../../backend/Operation';
import SSHUtils from '../../../backend/SSHUtils';

const opn = new Operation();

opn.setDescription('Transfer folder from the remote cluster to resop server');

opn.defineOptions({
  source: 'full path (or relative path to $HOME) to remote folder',
  destination: 'full path to local folder',
});

function exec() {
  opn.noEmptyOptions();
  opn.noNullOptions();

  const sshell = new SSHUtils();

  // check if source is a folder
  let retobj = sshell.exec(`test -d ${opn.options.source}`, opn.user);
  if (!retobj.success) {
    opn.error(`${opn.options.source} not a folder`);
  }

  // get folders recursively from the selected source
  const recursiveFolders = opn
    .runCommand(`find ${opn.options.source} -type d`)
    .split('\n')
    .filter((n) => n); // remove empty elements

  // create folder structure in destination
  recursiveFolders.forEach((dir) => {
    const localpath = `${opn.options.destination}/${dir}`;
    if (!fs.existsSync(localpath)) {
      fs.mkdirSync(localpath);
    }
  });

  // same with files
  const recursiveFiles = opn
    .runCommand(`find ${opn.options.source} -type f`)
    .split('\n')
    .filter((n) => n); // remove empty elements

  console.log(recursiveFiles);
  // scp them to destination
  recursiveFiles.forEach((file) => {
    retobj = sshell.scpRecv(
      file,
      `${opn.options.destination}/${file}`,
      opn.user
    );

    if (!retobj.success) {
      // else throw generic error
      opn.error(retobj.output);
    }
    opn.addLog(`${file} copied`);
  });

  return `Folder ${opn.options.source} copied to ${opn.options.destination}`;
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
