import Operation from '../../../backend/Operation';
/**
 * @summary Description
 */

// (mustdo) Instatiate a new Operation:
const opn = new Operation();

opn.setDescription('Creates a user in the api database');

// options in the POST request body, to be used in the Operation logic
opn.defineOptions({
  option1: '-> description',
  option2: '-> description',
});

// Create an execution function that will constitute the body of the operation.
// This fucntion will be executed on a POST request to this operation corresponding
// endpoint.
// Can contain any arbitrary logic, be sync or async
async function exec() {
  // an Operation can run a command in the remote cluster and read its stdout.
  // The command is executed on behalf of the API user (=cluser user) running it.
  // Error handling is NOT need on commands, it is already done by the Operation.
  // Commands can be of 2 types:

  // standard strings
  const stdout1 = await opn.runCommand('my_command --flag option input');

  // use a command defined in this operator's commands, as it would be in a POST request
  const stdout2 = await opn.runCommandDefined({
    command: 'command_name',
    option1: 'option_argument',
    input: 'stdin for command name',
  });

  // add log information to the HTTP response and API log
  opn.addLog('commands completed...');

  // any JS code can be used, including exeternal modules
  let out = stdout2;
  out = `${out}, ${stdout1}`;

  // Error handling via .error() method. The Opeation will be interruped at the first .error
  // found
  if (out === null) {
    opn.error('no output from commands!');
  }

  // the result of the operation
  return out;
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
