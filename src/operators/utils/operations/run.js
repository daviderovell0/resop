import Operation from '../../../backend/Operation';

const opn = new Operation();

opn.setDescription('Execute a script or a bin file');

opn.defineOptions({
  path: 'fullpath to the file or relative path with respect to $HOME',
});

function exec() {
  opn.noEmptyOptions();
  opn.noNullOptions();
  return opn.runCommand(opn.options.path);
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
