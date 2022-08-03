/* eslint-disable no-param-reassign */
import * as fs from 'fs';
import * as path from 'path';
import Operation from '../../../backend/Operation';
import SSHUtils from '../../../backend/SSHUtils';

const opn = new Operation();

opn.setDescription('Transfer folder from resop server to remote cluster');

opn.defineOptions({
  source: 'full path to local folder',
  destination: 'full path (or relative path to $HOME) to remote location',
});

// recursively read a local folder
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
      // recurse if directory
      arrayOfFiles = getAllFiles(`${dirPath}/${file}`, arrayOfFiles);
    } else {
      // if file, append full path
      arrayOfFiles.push(`${dirPath}/${file}`);
    }
  });

  return arrayOfFiles;
}

function parseDirs(dirPath, linedDirs) {
  const files = fs.readdirSync(dirPath);
  const { base } = path.parse(opn.options.source);
  const relativePath = base + dirPath.slice(opn.options.source.length);
  // add directory we are inspecting
  linedDirs = linedDirs.concat(`${opn.options.destination}/${relativePath} `);

  // recurse in other directories
  files.forEach((dir) => {
    if (fs.statSync(`${dirPath}/${dir}`).isDirectory()) {
      linedDirs = parseDirs(`${dirPath}/${dir}`, linedDirs);
    }
  });

  return linedDirs;
}

function exec() {
  opn.noEmptyOptions();
  opn.noNullOptions();

  const sshell = new SSHUtils();
  // check if destination is a directory
  let retobj = sshell.exec(`test -d ${opn.options.destination}`, opn.user);
  if (!retobj.success && retobj.output === '') {
    opn.error(`${opn.options.destination} is not a valid destination folder`);
  }
  if (!retobj.success) {
    opn.error(retobj.output);
  }

  // replicate directory structure remotely
  const listedDirs = parseDirs(opn.options.source, '');
  opn.runCommand(`mkdir -p ${listedDirs}`);

  const fileList = getAllFiles(opn.options.source, []);
  const { base } = path.parse(opn.options.source);

  // send all files one by one
  fileList.forEach((file) => {
    // build path for remote folder
    const destinationPath = `${opn.options.destination}/${base}${file.slice(
      opn.options.source.length
    )}`;
    retobj = sshell.scpSend(file, destinationPath, opn.user);
    if (retobj.success) {
      opn.addLog(`sent ${file}`);
    } else {
      opn.error(retobj.output);
    }
  });
  return (
    `Folder ${opn.options.source} sent to ` +
    `${process.env.CLUSTER_NAME}:${opn.options.destination}`
  );
}

opn.set(exec);

export default opn;
