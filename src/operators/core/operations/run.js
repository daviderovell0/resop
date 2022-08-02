import Operation from '../../../backend/Operation';

const opn = new Operation();

opn.setDescription('Run a command or a script on the remote default shell');

opn.defineOptions({
  input:
    'command or path to the script (can use relative path with respect to $HOME)',
});

function exec() {
  opn.noEmptyOptions();
  opn.noNullOptions();
  return opn.runCommand(opn.options.input);
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
